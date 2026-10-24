import { Types } from 'mongoose'
import QueryBuilder from '../../builder/QueryBuilder'
import { ICalculation } from './calculation.interface'
import { Calculation } from './calculation.model'

import { Subscription } from '../subscription/subscription.model'
import { User } from '../user/user.model'
import dayjs from 'dayjs'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

const createCalculationIntoDB = async (
  userId: Types.ObjectId,
  payload: ICalculation,
) => {
  // Check user's current subscription status
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  }).populate('planId')

  const isPremium =
    subscription &&
    ((subscription.planId as any)?.name === 'Pro' ||
      (subscription.planId as any)?.name === 'Annual')

  if (!isPremium) {
    // Check 7-day trial status from User
    const user = await User.findById(userId)
    const now = dayjs()

    let trialEnd: dayjs.Dayjs | null = null
    if (user?.subscriptionExpiresAt) {
      trialEnd = dayjs(user.subscriptionExpiresAt)
    } else if (user?.createdAt) {
      trialEnd = dayjs(user.createdAt).add(7, 'day')
    }

    const isTrialActive = trialEnd ? trialEnd.isAfter(now) : false

    if (!isTrialActive) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Your 7-day free trial has expired. Please upgrade to Pro to continue creating calculations.',
      )
    }

    const startOfToday = dayjs().startOf('day').toDate()
    const endOfToday = dayjs().endOf('day').toDate()

    const todayCount = await Calculation.countDocuments({
      user: userId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    })

    if (todayCount >= 10) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Daily calculation limit reached (10/day during free trial). Upgrade to Pro for unlimited calculations.',
      )
    }
  }

  payload.user = userId

  // Apply Load Calculator formulas if type is LOAD
  if (payload.type === 'LOAD' && payload.loadData) {
    const data = payload.loadData
    data.totalFSC = data.fuelSurcharge * data.loadedMiles
    data.totalDH = data.dhMiles * data.dhRate
    data.totalRevenue =
      data.baseRate * data.loadedMiles +
      data.totalFSC +
      data.tolls +
      data.totalDH +
      data.bonus
    data.totalMiles = data.loadedMiles + data.dhMiles

    if (data.totalMiles > 0) {
      data.compensationPerMile = data.totalRevenue / data.totalMiles
    } else {
      data.compensationPerMile = 0
    }

    data.totalCost = data.costPerMile * data.totalMiles
    data.profitPerMile = data.compensationPerMile - data.costPerMile
    data.totalProfit = data.totalMiles * data.profitPerMile

    const driverRatio = data.driverPercentage / 100
    data.driverPay = data.totalRevenue * driverRatio
    data.ownerPay = data.totalRevenue * (1 - driverRatio)
  }

  // Apply Rate Planner formulas if type is GOAL
  if (payload.type === 'GOAL' && payload.goalData) {
    const data = payload.goalData

    // SUGGESTED MAX DEADHEAD PER DAY = B6*0.20
    data.maxDHPerDay = data.maxMilesPerDay * 0.20 // E7
    // SUGGESTED MAX DEADHEAD PER WEEK = E7*B5
    data.maxDHPerWeek = data.maxDHPerDay * data.daysPerWeek // E8

    // E2: LOADED MILES NEEDED PER WEEK
    data.loadedMilesNeeded = data.daysPerWeek * data.maxMilesPerDay

    // Total Cost = E2 * B3
    data.totalCost = data.loadedMilesNeeded * data.costPerMile

    // Total Revenue = B2 + E6
    data.totalRevenue = data.desiredWeeklyProfit + data.totalCost

    if (data.loadedMilesNeeded > 0) {
      // MINIMUM TARGET RATE PER MILE NEEDED = E5 / E2
      data.minTargetRate = data.totalRevenue / data.loadedMilesNeeded
    } else {
      data.minTargetRate = 0
    }
  }

  // Apply CPM Calculator formulas if type is COST
  if (payload.type === 'COST' && payload.costData) {
    const data = payload.costData

    // 1. WEEKLY FIXED COSTS
    data.totalWeeklyFixed =
      data.insurance +
      data.truckPayment +
      data.escrow +
      data.repairSavings +
      data.driverPayFixed +
      data.permits +
      data.otherFixed

    // 2. VARIABLE COSTS
    // Weekly Fuel Cost = (Miles Driven / MPG) * Fuel Price
    if (data.avgMPG > 0) {
      data.weeklyFuelCost = (data.milesPerWeek / data.avgMPG) * data.fuelPrice
    } else {
      data.weeklyFuelCost = 0
    }

    // Weekly Oil Change Cost = (Oil Changes Per Year * Cost Per Oil Change) / 52
    data.weeklyOilChangeCost =
      (data.oilChangesPerYear * data.costPerOilChange) / 52
    // Weekly Tire Cost = Tire Cost Per Year / 52
    data.weeklyTireCost = data.tireCostPerYear / 52
    // Weekly Maintenance Cost = Maintenance Cost Per Year / 52
    data.weeklyMaintenanceCost = data.maintenanceCostPerYear / 52

    data.totalWeeklyVariable =
      data.weeklyFuelCost +
      data.weeklyOilChangeCost +
      data.weeklyTireCost +
      data.weeklyMaintenanceCost

    // 3. FINAL OPERATING COST
    data.totalWeeklyOperatingCost =
      data.totalWeeklyFixed + data.totalWeeklyVariable

    // TRUE COST PER MILE = Total Weekly Operating Cost / Miles Driven Per Week
    if (data.milesPerWeek > 0) {
      data.trueCPM = data.totalWeeklyOperatingCost / data.milesPerWeek
    } else {
      data.trueCPM = 0
    }
  }

  const result = await Calculation.create(payload)

  // Automatically update the user's draft to match the inputs of this last saved calculation
  const draftUpdate: any = {}
  if (payload.type === 'LOAD' && payload.loadData) {
    draftUpdate['draft.loadCalculator'] = payload.loadData
  } else if (payload.type === 'COST' && payload.costData) {
    draftUpdate['draft.costsCalculator'] = payload.costData
  } else if (payload.type === 'GOAL' && payload.goalData) {
    draftUpdate['draft.ratePlanner'] = payload.goalData
  }

  if (Object.keys(draftUpdate).length > 0) {
    try {
      await User.findByIdAndUpdate(userId, { $set: draftUpdate })
      console.log(`Updated user ${userId} draft to match last saved calculation of type ${payload.type}`)
    } catch (e) {
      console.error('Failed to update user draft on calculation save:', e)
    }
  }

  return result
}

const getCalculationsFromDB = async (
  userId: Types.ObjectId,
  query: Record<string, unknown>,
) => {
  // Check user's current subscription status
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  }).populate('planId')

  const isPremium = subscription && (
    (subscription.planId as any)?.name === 'Pro' || 
    (subscription.planId as any)?.name === 'Annual'
  )

  let calculationQuery;
  if (!isPremium) {
    // Basic history: only show the latest 10 calculations
    const latestCalculations = await Calculation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id')
      .lean()

    const allowedIds = latestCalculations.map((c) => c._id)

    calculationQuery = new QueryBuilder(
      Calculation.find({ user: userId, _id: { $in: allowedIds } }),
      query,
    )
      .filter()
      .sort()
      .paginate()
      .fields()
  } else {
    calculationQuery = new QueryBuilder(
      Calculation.find({ user: userId }),
      query,
    )
      .filter()
      .sort()
      .paginate()
      .fields()
  }

  const result = await calculationQuery.modelQuery
  const meta = await calculationQuery.getPaginationInfo()

  return {
    meta,
    result,
  }
}

const deleteCalculationFromDB = async (userId: Types.ObjectId, id: string) => {
  const result = await Calculation.findOneAndDelete({ _id: id, user: userId })
  return result
}

const getSingleCalculationFromDB = async (
  userId: Types.ObjectId,
  id: string,
) => {
  const result = await Calculation.findOne({ _id: id, user: userId })
  return result
}

const getStatsFromDB = async (userId: Types.ObjectId) => {
  const totalCalculations = await Calculation.countDocuments({ user: userId })

  // 1. Check if user has an active Stripe or IAP subscription
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  }).populate('planId')

  const now = dayjs()

  if (subscription) {
    const end = dayjs(subscription.currentPeriodEnd)
    const diffHours = end.diff(now, 'hour', true)
    const planLeftDays = Math.max(0, Math.ceil(diffHours / 24))

    return {
      totalCalculations,
      planLeftDays,
      subscriptionStatus: subscription.status,
      planName: (subscription.planId as any)?.name || 'Pro',
      isTrialExpired: false,
    }
  }

  // 2. User has no paid subscription: Check 7-day free trial from User
  const user = await User.findById(userId)
  let trialExpiresAt: dayjs.Dayjs

  if (user?.subscriptionExpiresAt) {
    trialExpiresAt = dayjs(user.subscriptionExpiresAt)
  } else {
    // If not set yet, trial starts from user.createdAt for 7 days
    const createdAt = user?.createdAt ? dayjs(user.createdAt) : now
    trialExpiresAt = createdAt.add(7, 'day')

    // If not set yet, check device eligibility
    let isEligible = !user?.trialUsed;
    if (isEligible && user?.deviceId) {
      const existingDeviceUser = await User.findOne({
        deviceId: user.deviceId,
        _id: { $ne: user._id },
        trialUsed: true,
      });
      if (existingDeviceUser) {
        isEligible = false;
      }
    }

    if (!isEligible) {
      trialExpiresAt = now;
    }

    // Persist this trial expiration to User model
    await User.findByIdAndUpdate(userId, {
      $set: {
        subscriptionStatus: trialExpiresAt.isAfter(now) ? 'trialing' : 'expired',
        subscriptionTier: isEligible ? 'trial' : 'none',
        trialUsed: true,
        subscriptionExpiresAt: trialExpiresAt.toDate(),
      },
    })
  }

  const remainingHours = trialExpiresAt.diff(now, 'hour', true)
  if (remainingHours > 0) {
    // Active free trial: accurately count down days left (e.g. 7 on day 1, 6 on day 2, down to 1)
    const planLeftDays = Math.max(1, Math.ceil(remainingHours / 24))
    return {
      totalCalculations,
      planLeftDays,
      subscriptionStatus: 'trialing',
      planName: 'Free Trial',
      isTrialExpired: false,
    }
  } else {
    // Trial has expired
    return {
      totalCalculations,
      planLeftDays: 0,
      subscriptionStatus: 'expired',
      planName: 'Expired Trial',
      isTrialExpired: true,
    }
  }
}

const getExportDataFromDB = async (userId: Types.ObjectId) => {
  const calculations = await Calculation.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean()

  // Flatten data for CSV
  const flattened = calculations.map((calc: any) => {
    const base = {
      id: calc._id,
      type: calc.type,
      createdAt: calc.createdAt,
    }

    if (calc.type === 'LOAD' && calc.loadData) {
      return { ...base, ...calc.loadData }
    } else if (calc.type === 'GOAL' && calc.goalData) {
      return { ...base, ...calc.goalData }
    } else if (calc.type === 'COST' && calc.costData) {
      return { ...base, ...calc.costData }
    }
    return base
  })

  return flattened
}

export const CalculationService = {
  createCalculationIntoDB,
  getCalculationsFromDB,
  deleteCalculationFromDB,
  getSingleCalculationFromDB,
  getStatsFromDB,
  getExportDataFromDB,
}

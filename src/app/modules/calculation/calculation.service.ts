import { Types } from 'mongoose'
import QueryBuilder from '../../builder/QueryBuilder'
import { ICalculation } from './calculation.interface'
import { Calculation } from './calculation.model'

import { Subscription } from '../subscription/subscription.model'
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

  const isPremium = subscription && (
    (subscription.planId as any)?.name === 'Pro' || 
    (subscription.planId as any)?.name === 'Annual'
  )

  if (!isPremium) {
    const startOfToday = dayjs().startOf('day').toDate()
    const endOfToday = dayjs().endOf('day').toDate()

    const todayCount = await Calculation.countDocuments({
      user: userId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    })

    if (todayCount >= 10) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Daily calculation limit reached. Please upgrade to Pro.',
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

    // Total Cost = (E2 + E8) * B3
    data.totalCost = (data.loadedMilesNeeded + data.maxDHPerWeek) * data.costPerMile

    // Total Revenue = B2 + E6
    data.totalRevenue = data.desiredWeeklyProfit + data.totalCost

    if ((data.loadedMilesNeeded + data.maxDHPerWeek) > 0) {
      // MINIMUM TARGET RATE PER MILE NEEDED = E5 / (E2 + E8)
      data.minTargetRate = data.totalRevenue / (data.loadedMilesNeeded + data.maxDHPerWeek)
    } else {
      data.minTargetRate = 0
    }

    const driverRatio = data.driverPercentage / 100
    // Using desiredWeeklyProfit as the base for earnings split if it's the goal
    data.driverPay = data.desiredWeeklyProfit * driverRatio
    data.ownerPay = data.desiredWeeklyProfit * (1 - driverRatio)
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

  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  }).populate('planId')

  let planLeftDays = 0
  if (subscription) {
    const now = dayjs()
    const end = dayjs(subscription.currentPeriodEnd)
    planLeftDays = end.diff(now, 'day')
    if (planLeftDays < 0) planLeftDays = 0
  }

  return {
    totalCalculations,
    planLeftDays,
    subscriptionStatus: subscription?.status || 'none',
    planName: (subscription?.planId as any)?.name || 'No Plan',
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

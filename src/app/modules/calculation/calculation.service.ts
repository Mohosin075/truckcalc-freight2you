import { Types } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { ICalculation } from './calculation.interface';
import { Calculation } from './calculation.model';

import { Subscription } from '../subscription/subscription.model';
import dayjs from 'dayjs';

const createCalculationIntoDB = async (userId: Types.ObjectId, payload: ICalculation) => {
  payload.user = userId;

  // Apply Load Calculator formulas if type is LOAD
  if (payload.type === 'LOAD' && payload.loadData) {
    const data = payload.loadData;
    data.totalFSC = data.fuelSurcharge * data.loadedMiles;
    data.totalDH = data.dhMiles * data.dhRate;
    data.totalRevenue = (data.baseRate * data.loadedMiles) + data.totalFSC + data.tolls + data.totalDH + data.bonus;
    data.totalMiles = data.loadedMiles + data.dhMiles;
    
    if (data.totalMiles > 0) {
      data.compensationPerMile = data.totalRevenue / data.totalMiles;
    } else {
      data.compensationPerMile = 0;
    }

    data.totalCost = data.costPerMile * data.totalMiles;
    data.profitPerMile = data.compensationPerMile - data.costPerMile;
    data.totalProfit = data.totalMiles * data.profitPerMile;

    const driverRatio = data.driverPercentage / 100;
    data.driverPay = data.totalRevenue * driverRatio;
    data.ownerPay = data.totalRevenue * (1 - driverRatio);
  }

  // Apply Rate Planner formulas if type is GOAL
  if (payload.type === 'GOAL' && payload.goalData) {
    const data = payload.goalData;
    // B5: daysPerWeek, B7: maxMilesPerDay
    data.loadedMilesNeeded = data.daysPerWeek * data.maxMilesPerDay; // E2

    if (data.loadedMilesNeeded > 0) {
      // MINIMUM TARGET RATE PER MILE NEEDED = B3+(B2/E2)
      data.minTargetRate = data.costPerMile + (data.desiredWeeklyProfit / data.loadedMilesNeeded); // E4
    } else {
      data.minTargetRate = 0;
    }

    // SUGGESTED MAX DEADHEAD PER DAY = B7*0.15
    data.maxDHPerDay = data.maxMilesPerDay * 0.15; // E7
    // SUGGESTED MAX DEADHEAD PER WEEK = E7*B5
    data.maxDHPerWeek = data.maxDHPerDay * data.daysPerWeek; // E8

    // Total Revenue = E2*E4 + E8*B4
    data.totalRevenue = (data.loadedMilesNeeded * data.minTargetRate) + (data.maxDHPerWeek * data.deadheadPayPerMile);
    // Total Cost = B3 * (E2 + E8)  -- Assuming total miles = loaded + deadhead
    data.totalCost = data.costPerMile * (data.loadedMilesNeeded + data.maxDHPerWeek);

    const driverRatio = data.driverPercentage / 100;
    // Using desiredWeeklyProfit as the base for earnings split if it's the goal
    data.driverPay = data.desiredWeeklyProfit * driverRatio;
    data.ownerPay = data.desiredWeeklyProfit * (1 - driverRatio);
  }

  const result = await Calculation.create(payload);
  return result;
};

const getCalculationsFromDB = async (userId: Types.ObjectId, query: Record<string, unknown>) => {
  const calculationQuery = new QueryBuilder(
    Calculation.find({ user: userId }),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await calculationQuery.modelQuery;
  const meta = await calculationQuery.getPaginationInfo();

  return {
    meta,
    result,
  };
};

const deleteCalculationFromDB = async (userId: Types.ObjectId, id: string) => {
  const result = await Calculation.findOneAndDelete({ _id: id, user: userId });
  return result;
};

const getSingleCalculationFromDB = async (userId: Types.ObjectId, id: string) => {
  const result = await Calculation.findOne({ _id: id, user: userId });
  return result;
};

const getStatsFromDB = async (userId: Types.ObjectId) => {
  const totalCalculations = await Calculation.countDocuments({ user: userId });
  
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  }).populate('planId');

  let planLeftDays = 0;
  if (subscription) {
    const now = dayjs();
    const end = dayjs(subscription.currentPeriodEnd);
    planLeftDays = end.diff(now, 'day');
    if (planLeftDays < 0) planLeftDays = 0;
  }

  return {
    totalCalculations,
    planLeftDays,
    subscriptionStatus: subscription?.status || 'none',
    planName: (subscription?.planId as any)?.name || 'No Plan',
  };
};

const getExportDataFromDB = async (userId: Types.ObjectId) => {
  const calculations = await Calculation.find({ user: userId }).sort({ createdAt: -1 });
  
  // Flatten data for CSV
  const flattened = calculations.map((calc) => {
    const base = {
      id: calc._id,
      type: calc.type,
      createdAt: calc.createdAt,
    };

    if (calc.type === 'LOAD' && calc.loadData) {
      return { ...base, ...calc.loadData };
    } else if (calc.type === 'GOAL' && calc.goalData) {
      return { ...base, ...calc.goalData };
    } else if (calc.type === 'COST' && calc.costData) {
      return { ...base, ...calc.costData };
    }
    return base;
  });

  return flattened;
};

export const CalculationService = {
  createCalculationIntoDB,
  getCalculationsFromDB,
  deleteCalculationFromDB,
  getSingleCalculationFromDB,
  getStatsFromDB,
  getExportDataFromDB,
};

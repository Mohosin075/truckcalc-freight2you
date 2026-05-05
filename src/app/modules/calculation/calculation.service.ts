import { Types } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { ICalculation } from './calculation.interface';
import { Calculation } from './calculation.model';

import { Subscription } from '../subscription/subscription.model';
import dayjs from 'dayjs';

const createCalculationIntoDB = async (userId: Types.ObjectId, payload: ICalculation) => {
  payload.user = userId;
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

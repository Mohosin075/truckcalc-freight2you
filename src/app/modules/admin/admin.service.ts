import { Calculation } from '../calculation/calculation.model';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';
import { Activity } from '../activity/activity.model';
import { SubscriptionPlan } from '../subscription/subscription-plan.model';
import dayjs from 'dayjs';
import { USER_ROLES, USER_STATUS } from '../../../enum/user';
import QueryBuilder from '../../builder/QueryBuilder';

const getDashboardStats = async () => {
  const now = dayjs();
  const currentMonthStart = now.startOf('month').toDate();
  const lastMonthStart = now.subtract(1, 'month').startOf('month').toDate();
  const lastMonthEnd = now.subtract(1, 'month').endOf('month').toDate();

  // 1. Total Users
  const totalUsers = await User.countDocuments({ role: USER_ROLES.USER });
  const lastMonthUsers = await User.countDocuments({
    role: USER_ROLES.USER,
    createdAt: { $lt: currentMonthStart },
  });
  const userGrowth = lastMonthUsers === 0 ? 100 : ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100;

  // 2. Active Subscriptions
  const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
  const lastMonthActiveSubs = await Subscription.countDocuments({
    status: 'active',
    createdAt: { $lt: currentMonthStart },
  });
  const subGrowth = lastMonthActiveSubs === 0 ? 100 : ((activeSubscriptions - lastMonthActiveSubs) / lastMonthActiveSubs) * 100;

  // 3. Monthly Revenue (Simplified: using plan prices of active subs)
  const currentSubs = await Subscription.find({ status: 'active' }).populate('planId');
  const monthlyRevenue = currentSubs.reduce((acc, sub: any) => acc + (sub.planId?.price || 0), 0);
  
  // 4. Churn Rate (Simplified: canceled subs this month / total subs)
  const canceledThisMonth = await Subscription.countDocuments({
    status: 'canceled',
    updatedAt: { $gte: currentMonthStart },
  });
  const churnRate = totalUsers === 0 ? 0 : (canceledThisMonth / totalUsers) * 100;

  // 5. User Activity Chart (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => now.subtract(i, 'day').format('MMM DD')).reverse();
  const activityData = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const dayStart = now.subtract(i, 'day').startOf('day').toDate();
      const dayEnd = now.subtract(i, 'day').endOf('day').toDate();
      const signups = await User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
      const activeUsers = await User.countDocuments({ updatedAt: { $gte: dayStart, $lte: dayEnd } }); // Simplified activity
      return { date: now.subtract(i, 'day').format('MMM DD'), signups, activeUsers };
    })
  );

  // 6. Recent Activity
  const recentActivities = await Activity.find()
    .populate('user', 'name email profile')
    .sort({ createdAt: -1 })
    .limit(5);

  // 7. Recent Alerts
  const recentAlerts = await Activity.find({ type: 'alert' })
    .sort({ createdAt: -1 })
    .limit(2);

  return {
    overview: {
      totalUsers: { value: totalUsers, change: userGrowth.toFixed(1) },
      activeSubscriptions: { value: activeSubscriptions, change: subGrowth.toFixed(1) },
      monthlyRevenue: { value: monthlyRevenue.toFixed(2), change: "0" }, // Change calculation needs historical revenue data
      churnRate: { value: churnRate.toFixed(1), change: "0" },
    },
    activityChart: activityData.reverse(),
    recentActivity: recentActivities,
    recentAlerts: recentAlerts,
  };
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find({ role: USER_ROLES.USER }), query)
    .search(['name', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.getPaginationInfo();

  return { meta, result };
};

const getSubscriptions = async (query: Record<string, unknown>) => {
  const subQuery = new QueryBuilder(Subscription.find().populate('userId planId'), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await subQuery.modelQuery;
  const meta = await subQuery.getPaginationInfo();

  return { meta, result };
};

const getSubscriptionPlans = async () => {
  const result = await SubscriptionPlan.find().sort({ priority: 1 });
  return result;
};


const getAnalytics = async () => {
  // 1. Total Calculations & Type Breakdown
  const totalCalculations = await Calculation.countDocuments();
  const byTypeRaw = await Calculation.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const typeMap: Record<string, number> = { LOAD: 0, GOAL: 0, COST: 0 };
  byTypeRaw.forEach((item: any) => {
    typeMap[item._id] = item.count;
  });

  const calculationBreakdown = [
    {
      type: 'LOAD',
      name: 'Load Calculations',
      count: typeMap.LOAD,
      percentage: totalCalculations > 0 ? Math.round((typeMap.LOAD / totalCalculations) * 100) : 0,
      color: '#00D193',
    },
    {
      type: 'GOAL',
      name: 'Weekly Target Goals',
      count: typeMap.GOAL,
      percentage: totalCalculations > 0 ? Math.round((typeMap.GOAL / totalCalculations) * 100) : 0,
      color: '#004D40',
    },
    {
      type: 'COST',
      name: 'Operating Cost / CPM',
      count: typeMap.COST,
      percentage: totalCalculations > 0 ? Math.round((typeMap.COST / totalCalculations) * 100) : 0,
      color: '#E2C255',
    },
  ];

  // 2. Freight Metrics from LOAD calculations
  const loadMetrics = await Calculation.aggregate([
    { $match: { type: 'LOAD', 'loadData.totalMiles': { $exists: true } } },
    {
      $group: {
        _id: null,
        totalMiles: { $sum: '$loadData.totalMiles' },
        totalRevenue: { $sum: '$loadData.totalRevenue' },
        totalProfit: { $sum: '$loadData.totalProfit' },
        totalDH: { $sum: '$loadData.dhMiles' },
        avgProfitPerMile: { $avg: '$loadData.profitPerMile' },
        avgRatePerMile: { $avg: '$loadData.compensationPerMile' },
        avgCostPerMile: { $avg: '$loadData.costPerMile' },
      },
    },
  ]);
  const loadStat = loadMetrics[0] || {
    totalMiles: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalDH: 0,
    avgProfitPerMile: 0,
    avgRatePerMile: 0,
    avgCostPerMile: 0,
  };

  // 3. Operating Cost Metrics
  const costMetrics = await Calculation.aggregate([
    { $match: { type: 'COST', 'costData.weeklyFuelCost': { $exists: true } } },
    {
      $group: {
        _id: null,
        avgWeeklyFuel: { $avg: '$costData.weeklyFuelCost' },
        avgWeeklyFixed: { $avg: '$costData.totalWeeklyFixed' },
        avgWeeklyVariable: { $avg: '$costData.totalWeeklyVariable' },
        avgWeeklyOperating: { $avg: '$costData.totalWeeklyOperatingCost' },
      },
    },
  ]);
  const costStat = costMetrics[0] || {
    avgWeeklyFuel: 0,
    avgWeeklyFixed: 0,
    avgWeeklyVariable: 0,
    avgWeeklyOperating: 0,
  };

  // 4. Monthly Calculation Timeline (Chart)
  const monthlyTimeline = await Calculation.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        loads: { $sum: { $cond: [{ $eq: ['$type', 'LOAD'] }, 1, 0] } },
        goals: { $sum: { $cond: [{ $eq: ['$type', 'GOAL'] }, 1, 0] } },
        costs: { $sum: { $cond: [{ $eq: ['$type', 'COST'] }, 1, 0] } },
        total: { $sum: 1 },
        totalMiles: { $sum: { $ifNull: ['$loadData.totalMiles', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const timelineFormatted = monthlyTimeline.map((item: any) => ({
    month: item._id,
    label: dayjs(item._id).format('MMM YYYY'),
    loads: item.loads,
    goals: item.goals,
    costs: item.costs,
    total: item.total,
    miles: item.totalMiles,
  }));

  // 5. Recent 10 Calculations Log
  const recentCalculations = await Calculation.find()
    .populate('user', 'name email profile')
    .sort({ createdAt: -1 })
    .limit(10);

  // 6. Subscription & User overview
  const totalUsers = await User.countDocuments({ role: USER_ROLES.USER });
  const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

  return {
    summary: {
      totalCalculations,
      totalMilesAnalyzed: Math.round(loadStat.totalMiles || 0),
      totalFreightRevenue: Math.round(loadStat.totalRevenue || 0),
      totalFreightProfit: Math.round(loadStat.totalProfit || 0),
      deadheadMiles: Math.round(loadStat.totalDH || 0),
      deadheadRatio: loadStat.totalMiles > 0 ? Number(((loadStat.totalDH / loadStat.totalMiles) * 100).toFixed(1)) : 0,
      avgRatePerMile: Number((loadStat.avgRatePerMile || 0).toFixed(2)),
      avgCostPerMile: Number((loadStat.avgCostPerMile || 0).toFixed(2)),
      avgProfitPerMile: Number((loadStat.avgProfitPerMile || 0).toFixed(2)),
      totalUsers,
      activeSubscriptions,
    },
    calculationBreakdown,
    operatingCostAverages: {
      avgWeeklyFuel: Math.round(costStat.avgWeeklyFuel || 0),
      avgWeeklyFixed: Math.round(costStat.avgWeeklyFixed || 0),
      avgWeeklyVariable: Math.round(costStat.avgWeeklyVariable || 0),
      avgWeeklyOperating: Math.round(costStat.avgWeeklyOperating || 0),
    },
    timeline: timelineFormatted,
    recentCalculations,
  };
};

export const AdminService = {
  getAnalytics,
  getDashboardStats,
  getAllUsers,
  getSubscriptions,
  getSubscriptionPlans,
};

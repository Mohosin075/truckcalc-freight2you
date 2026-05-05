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

export const AdminService = {
  getDashboardStats,
  getAllUsers,
  getSubscriptions,
  getSubscriptionPlans,
};

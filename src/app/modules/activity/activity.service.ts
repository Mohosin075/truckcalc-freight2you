import { IActivity } from './activity.interface';
import { Activity } from './activity.model';

const logActivity = async (payload: IActivity) => {
  const result = await Activity.create(payload);
  return result;
};

const getRecentActivities = async (limit: number = 10) => {
  const result = await Activity.find()
    .populate('user', 'name email profile')
    .sort({ createdAt: -1 })
    .limit(limit);
  return result;
};

export const ActivityService = {
  logActivity,
  getRecentActivities,
};

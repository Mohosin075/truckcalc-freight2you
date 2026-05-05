import { Types } from 'mongoose';

export type IActivityType = 'subscription' | 'security' | 'payment' | 'signup' | 'alert';

export type IActivity = {
  user?: Types.ObjectId;
  type: IActivityType;
  message: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

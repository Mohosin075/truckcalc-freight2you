import { Schema, model } from 'mongoose';
import { IActivity } from './activity.interface';

const activitySchema = new Schema<IActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      enum: ['subscription', 'security', 'payment', 'signup', 'alert'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Activity = model<IActivity>('Activity', activitySchema);

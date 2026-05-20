import { Schema, model } from 'mongoose'
import { IIapSubscription, IapSubscriptionModel } from './iap.interface'

const iapSubscriptionSchema = new Schema<IIapSubscription, IapSubscriptionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    platform: {
      type: String,
      enum: ['android', 'ios'],
      required: true,
    },
    purchaseToken: {
      type: String,
      default: null,
    },
    receiptData: {
      type: String,
      default: null,
    },
    productId: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'refunded'],
      default: 'active',
      required: true,
    },
    isSandbox: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for fast querying
iapSubscriptionSchema.index({ userId: 1 })
iapSubscriptionSchema.index({ transactionId: 1 }, { unique: true })
iapSubscriptionSchema.index({ status: 1 })

export const IapSubscription = model<IIapSubscription, IapSubscriptionModel>(
  'IapSubscription',
  iapSubscriptionSchema,
)

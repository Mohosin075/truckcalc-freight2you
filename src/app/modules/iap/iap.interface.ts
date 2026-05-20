import { Model, Types } from 'mongoose'

export interface IIapSubscription {
  _id?: Types.ObjectId
  userId: Types.ObjectId
  planId: Types.ObjectId
  platform: 'android' | 'ios'
  purchaseToken?: string
  receiptData?: string
  productId: string
  transactionId: string
  purchaseDate: Date
  expiryDate: Date
  status: 'active' | 'expired' | 'refunded'
  isSandbox: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type IapSubscriptionModel = Model<IIapSubscription>

export interface VerifyIapReceiptRequest {
  planId: string
  platform: 'android' | 'ios'
  productId: string
  transactionId: string
  purchaseToken?: string
  receiptData?: string
  isSandbox?: boolean
}

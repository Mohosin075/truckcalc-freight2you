import { Schema, model } from 'mongoose'
import { IReview, ReviewModel } from './review.interface'

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      populate: { path: 'reviewer', select: 'name profile' },
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      populate: { path: 'reviewee', select: 'name profile' },
    },
    rating: { type: Number, required: true },
    review: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

export const Review = model<IReview, ReviewModel>('Review', reviewSchema)

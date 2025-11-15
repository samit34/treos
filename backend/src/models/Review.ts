import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  job: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  reviewType: 'worker' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    reviewType: { type: String, enum: ['worker', 'client'], required: true },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ job: 1, reviewer: 1, reviewee: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);


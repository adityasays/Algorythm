import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IUserActivity extends Document {
  userId: Types.ObjectId;
  date: Date;
  count: number;
}

/**
 * Schema for UserActivity model, storing cumulative daily problem-solving activity for heatmap.
 */
const userActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    count: { type: Number, default: 0 }, // Total problems solved that day across platforms
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate entries per user and date
userActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IUserActivity>('UserActivity', userActivitySchema);
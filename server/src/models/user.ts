  import mongoose, { Schema, model, Document, Types } from 'mongoose';

  export interface IUser extends Document {
    name: string;
    username: string;
    collegeName: string;
    email: string;
    codeforcesUsername: string;
    codechefUsername: string;
    leetcodeUsername: string;
    password: string;
    ratings: {
      codeforces: number;
      codechef: number;
      leetcode: number;
    };
    compositeScore: number;
    potdSolved: number;
    streak: number;
    xp: number;
    level: number;
    blogCount: number;
    blogsPosted: Types.ObjectId[];
  }

  /**
   * Schema for User model, storing profile, rating, and blog information.
   */
  const userSchema = new Schema<IUser>(
    {
      name: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
        unique: true,
      },
      collegeName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      codeforcesUsername: {
        type: String,
        default: '',
      },
      codechefUsername: {
        type: String,
        default: '',
      },
      leetcodeUsername: {
        type: String,
        default: '',
      },
      password: {
        type: String,
        required: true,
      },
      ratings: {
        codeforces: { type: Number, default: 0 },
        codechef: { type: Number, default: 0 },
        leetcode: { type: Number, default: 0 },
      },
      compositeScore: { type: Number, default: 0 },
      potdSolved: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      blogCount: { type: Number, default: 0, min: 0 },
      blogsPosted: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
    },
    {
      timestamps: true,
    }
  );

  // Create indexes separately
  userSchema.index({ collegeName: 1 });
  userSchema.index({ 'ratings.codeforces': -1 });
  userSchema.index({ 'ratings.codechef': -1 });
  userSchema.index({ 'ratings.leetcode': -1 });
  userSchema.index({ compositeScore: -1 });
  userSchema.index({ blogCount: -1 });

  export default model<IUser>('User', userSchema);
import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  content: string;
  excerpt: string;
  publishedAt: Date;
  likes: number;
  likedBy: Types.ObjectId[];
  readTime: string;
  tags: string[];
  keywords: string[];
  category: string;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for Blog model, storing user blog posts.
 */
const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    publishedAt: { type: Date, default: Date.now },
    likes: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readTime: { type: String, required: true }, // e.g., "8 min read"
    tags: [{ type: String, trim: true }], // e.g., ["Dynamic Programming", "Algorithms"]
    keywords: [{ type: String, trim: true }], // e.g., ["DP", "optimization"]
    category: { type: String, required: true, trim: true }, // e.g., "Algorithms", "Tutorials"
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
blogSchema.index({ author: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ likedBy: 1 });

export default model<IBlog>('Blog', blogSchema);
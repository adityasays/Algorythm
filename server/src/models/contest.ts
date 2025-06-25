import mongoose, { Schema, Document } from 'mongoose';

interface IContest extends Document {
  id: string;
  name: string;
  platform: string;
  startTime: Date;
  duration: string;
  link: string;
  status: 'upcoming' | 'past';
  solutions?: Array<{
    videoId: string;
    title: string;
    url: string;
    thumbnail: string;
  }>;
}

const ContestSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  platform: { type: String, required: true },
  startTime: { type: Date, required: true },
  duration: { type: String, required: true },
  link: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'past'], required: true },
  solutions: [{
    videoId: { type: String },
    title: { type: String },
    url: { type: String },
    thumbnail: { type: String },
  }],
}, { timestamps: true });

export default mongoose.model<IContest>('contest', ContestSchema);
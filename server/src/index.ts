import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import contestRoutes from './routes/contestRoutes';
import leaderboardRouter from './routes/leaderboardRoutes';
import blogRoutes from './routes/blogRoutes';
import statusRoutes from './routes/statusRoutes';
import profileRoutes from './routes/profileRoutes';
import cronRoutes from './routes/cronRoutes';
import { scheduleActivityUpdate } from './cron/updateActivity';
import { startRatingCron } from './cron/updateRatings';
import { startContestCron } from './cron/updateContests';
import { updateContests } from './services/contestService';
import cookieParser from 'cookie-parser';

dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 10000;

app.use(helmet());
app.use(express.json());
app.use(cookieParser());



const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`🚫 CORS blocked: ${origin}`);
    return callback(new Error(`CORS not allowed for origin ${origin}`), false);
  },
  credentials: true,
}));

// Routes
app.use("/api/blogs", blogRoutes);
app.use("/api/", userRoutes);
app.use("/api/user", authRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/leaderboard", leaderboardRouter);
app.use('/api/profile', profileRoutes);
app.use("/api/status", statusRoutes);
app.use('/api/cron', cronRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  if (err.message.startsWith('CORS')) {
      res.status(403).json({ message: err.message });
      return;

  }
  res.status(500).send('Something broke!');
});


app.use((req: Request, res: Response): void => {
  res.status(404).json({ message: 'Route not found' });
});

connectDB()
  .then(async (): Promise<void> => {
    console.log('Running updateContests one time...');  
    await updateContests();
    console.log('updateContests completed');

    app.listen(PORT, (): void => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    startRatingCron();
    startContestCron();
    scheduleActivityUpdate();
  })
  .catch((err: Error): void => {
    console.error("DB Connection Failed:", err);
  });

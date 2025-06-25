  import { Request, Response } from 'express';
  import contest from '../models/contest';

  export const getUpcomingContests = async (req: Request, res: Response) => {
    try {
      const contests = await contest.find({ status: 'upcoming' })
        .sort({ startTime: 1 })
        .limit(8);
      res.json(contests);
    } catch (error) {
      console.error('Error fetching upcoming contests:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const getPastContests = async (req: Request, res: Response) => {
    try {
      const contests = await contest.find({ status: 'past' })
        .sort({ startTime: -1 })
        .limit(20);
      res.json(contests);
    } catch (error) {
      console.error('Error fetching past contests:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
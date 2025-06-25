import { Router, Request, Response, NextFunction } from 'express';
import { runActivityUpdate } from '../cron/updateActivity';
import { runContestUpdate } from '../cron/updateContests';
import { runRatingUpdate } from '../cron/updateRatings';

const router: Router = Router();

// Middleware to verify a secret token
const verifyCronToken = (req: Request, res: Response, next: NextFunction): void => {
  const token: string | undefined = req.headers['x-cron-token'] as string;
  const expectedToken: string = process.env.CRON_SECRET_TOKEN || 'default-secret';
  
  if (token !== expectedToken) {
    res.status(401).json({ message: 'Invalid cron token' });
    return;
  }
  next();
};

// Health check to keep backend awake
router.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Trigger activity update
router.post('/activity', verifyCronToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await runActivityUpdate('api');
    res.status(200).json({ message: 'Activity update triggered successfully' });
  } catch (error: unknown) {
    console.error('Error triggering activity update:', error);
    res.status(500).json({ message: 'Failed to trigger activity update' });
  }
});

// Trigger contest update
router.post('/contests', verifyCronToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await runContestUpdate('api');
    res.status(200).json({ message: 'Contest update triggered successfully' });
  } catch (error: unknown) {
    console.error('Error triggering contest update:', error);
    res.status(500).json({ message: 'Failed to trigger contest update' });
  }
});

// Trigger rating update
router.post('/ratings', verifyCronToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await runRatingUpdate('api');
    res.status(200).json({ message: 'Rating update triggered successfully' });
  } catch (error: unknown) {
    console.error('Error triggering rating update:', error);
    res.status(500).json({ message: 'Failed to trigger rating update' });
  }
});

export default router;
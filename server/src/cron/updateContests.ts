import { schedule } from 'node-cron';
import { updateContests } from '../services/contestService';

let isRunning = false;

export async function runContestUpdate(source: string = 'cron'): Promise<void> {
  if (isRunning) {
    console.log(`Contest update (source: ${source}) already running, skipping...`);
    return;
  }
  isRunning = true;
  console.log(`Running contest update (source: ${source})...`);
  try {
    await updateContests();
    console.log(`Contest update (source: ${source}) completed.`);
  } catch (error) {
    console.error(`Contest update (source: ${source}) error:`, error);
  } finally {
    isRunning = false;
  }
}

export const startContestCron = () => {
  // Run immediately on server start
  runContestUpdate('initial').catch(err => console.error('Initial contest update error:', err));

  // Schedule every hour at minute 0
  schedule('0 * * * *', () => runContestUpdate('cron'), {
    timezone: 'Asia/Kolkata'
  });
};
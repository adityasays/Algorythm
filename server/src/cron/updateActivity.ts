import cron from 'node-cron';
import User from '../models/user';
import { fetchUserDailySubmissions, storeDailySubmissions } from '../services/submissionService';

let isRunning = false;

export async function runActivityUpdate(source: string = 'cron'): Promise<void> {
  if (isRunning) {
    console.log(`Activity update (source: ${source}) already running, skipping...`);
    return;
  }
  isRunning = true;
  console.log(`Starting activity update (source: ${source}) at`, new Date().toISOString());
  try {
    const users = await User.find({
      $or: [{ leetcodeUsername: { $ne: null } }, { codeforcesUsername: { $ne: null } }, { codechefUsername: { $ne: null } }],
    });

    console.log(`Found ${users.length} users with platform handles`);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    console.log(`Processing data for ${yesterday.toISOString().split('T')[0]}`);

    for (const user of users) {
      console.log(`Processing user ${user.username} (${user._id})`);
      const submissionData = await fetchUserDailySubmissions(user, yesterday);
      const stored = await storeDailySubmissions(submissionData);
      console.log(`Storage for ${user.username} ${stored ? 'succeeded' : 'failed'}`);
    }

    console.log(`Activity update (source: ${source}) completed.`);
  } catch (error) {
    console.error(`Activity update (source: ${source}) error:`, error);
  } finally {
    isRunning = false;
  }
}

export function scheduleActivityUpdate() {
  console.log('Scheduling activity update...');
  // Run immediately on server start
  runActivityUpdate('initial').catch(err => console.error('Initial activity update error:', err));

  // Schedule every hour at minute 0
  cron.schedule('0 * * * *', () => runActivityUpdate('cron'), {
    timezone: 'Asia/Kolkata'
  });
}
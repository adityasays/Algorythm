import cron from 'node-cron';
import User from '../models/user';
import { getCodeforcesRating, getLeetcodeRating, getCodechefRating } from '../utils/fetchratings';

let isRunning = false;

export async function runRatingUpdate(source: string = 'cron'): Promise<void> {
  if (isRunning) {
    console.log(`Rating update (source: ${source}) already running, skipping...`);
    return;
  }
  isRunning = true;
  console.log(`Starting rating update (source: ${source})...`);
  try {
    const users = await User.find().select(
      'username codeforcesUsername codechefUsername leetcodeUsername ratings compositeScore'
    );

    if (!users.length) {
      console.log('No users found.');
      return;
    }

    for (const user of users) {
      try {
        const cf = await getCodeforcesRating(user.codeforcesUsername);
        const cc = await getCodechefRating(user.codechefUsername);
        const lc = await getLeetcodeRating(user.leetcodeUsername);

        const score = cf * 2 + cc * 1.5 + lc;

        user.ratings = { codeforces: cf, codechef: cc, leetcode: lc };
        user.compositeScore = score;
        await user.save();

        console.log(`Updated ${user.username}: CF=${cf}, CC=${cc}, LC=${lc}, Score=${score}`);
      } catch (err) {
        console.error(`Failed to update ${user.username}:`, err);
      }
    }

    console.log(`Ratings updated (source: ${source}) successfully.`);
  } catch (err) {
    console.error(`Rating update (source: ${source}) error:`, err);
  } finally {
    isRunning = false;
  }
}

export const startRatingCron = (): void => {
  // Run immediately on server start
  runRatingUpdate('initial').catch(err => console.error('Initial rating update error:', err));

  // Schedule every hour at minute 0
  cron.schedule('0 * * * *', () => runRatingUpdate('cron'), {
    timezone: 'Asia/Kolkata'
  });
};
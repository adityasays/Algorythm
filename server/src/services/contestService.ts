import axios from 'axios';
import axiosRetry from 'axios-retry';
import { google } from 'googleapis';
import contest from '../models/contest';
import dotenv from 'dotenv';
import { addWeeks, isBefore, nextDay, setHours, setMinutes } from 'date-fns';

dotenv.config();

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => retryCount * 2000,
  retryCondition: (error) => error.code === 'ENOTFOUND' || !error.response || error.response.status >= 400,
});

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
  },
  timeout: 15000,
});

const parseDurationToMs = (duration: string): number => {
  const parts = duration.match(/(\d+)([dhm])/g);
  if (!parts) {
    const timeMatch = duration.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]) || 0;
      const minutes = parseInt(timeMatch[2]) || 0;
      return (hours * 60 + minutes) * 60 * 1000;
    }
    return 2 * 60 * 60 * 1000; 
  }
  return parts.reduce((total, part) => {
    const value = parseInt(part);
    const unit = part.slice(-1);
    if (unit === 'd') return total + value * 24 * 60 * 60 * 1000;
    if (unit === 'h') return total + value * 60 * 60 * 1000;
    if (unit === 'm') return total + value * 60 * 1000;
    return total;
  }, 0);
};

// Helper to format duration from seconds to string
const formatDuration = (seconds: number): string => {
  let ms = seconds * 1000;
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms %= 24 * 60 * 60 * 1000;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  ms %= 60 * 60 * 1000;
  const minutes = Math.floor(ms / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Check if contest has ended
const hasContestEnded = (startTime: Date, duration: string): boolean => {
  const startMs = new Date(startTime).getTime();
  const durationMs = parseDurationToMs(duration);
  const endMs = startMs + durationMs;
  return Date.now() > endMs;
};

// Normalize contest data
const normalizeContest = (contest: any, platform: string) => {
  const startTime = new Date(contest.startTime || contest.start_time || Date.now());
  const duration = contest.duration
    ? typeof contest.duration === 'number'
      ? formatDuration(contest.duration)
      : contest.duration
    : formatDuration(7200); // Default 2 hours
  return {
    id: contest.id || `${platform}-${startTime.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    name: contest.name || `Unnamed ${platform} Contest`,
    platform,
    startTime,
    duration,
    link: contest.link || contest.url || `https://${platform.toLowerCase().replace(' ', '')}.com/contests`,
    status: hasContestEnded(startTime, duration) ? 'past' : 'upcoming',
  };
};

// Fetch YouTube solutions (up to 3 videos)
const fetchYouTubeSolutions = async (contestName: string, platform: string): Promise<any[]> => {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: `${contestName} ${platform} solution`,
      type: ['video'],
      maxResults: 3,
    });

    return (
      response.data.items?.map(item => ({
        videoId: item.id?.videoId || '',
        title: item.snippet?.title || 'Untitled Video',
        url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : '',
        thumbnail: item.snippet?.thumbnails?.default?.url || '',
      })) || []
    );
  } catch (error: any) {
    console.error(`Error fetching YouTube solutions for ${contestName}:`, error.message || error);
    return [];
  }
};

// Fetch Codeforces contests via API
const fetchCodeforcesContests = async (): Promise<any[]> => {
  try {
    const response = await axiosInstance.get('https://codeforces.com/api/contest.list');
    if (!response.data || !response.data.result) {
      throw new Error('Invalid response from Codeforces API');
    }
    const contests = response.data.result
      .filter((contest: any) => contest.phase === 'BEFORE') // Only upcoming contests
      .sort((a: any, b: any) => a.startTimeSeconds - b.startTimeSeconds) // Sort by start time
      .slice(0, 2) // Take 2 nearest upcoming contests
      .map((contest: any) => normalizeContest({
        id: contest.id.toString(),
        name: contest.name,
        startTime: new Date(contest.startTimeSeconds * 1000),
        duration: contest.durationSeconds,
        link: `https://codeforces.com/contest/${contest.id}`,
      }, 'Codeforces'));
    console.log(`Fetched ${contests.length} Codeforces contests`);
    return contests;
  } catch (error: any) {
    console.error('Error fetching Codeforces contests:', error.message || error, error.response?.status || 'No status');
    return [];
  }
};

// Generate AtCoder contests manually
const fetchAtCoderContests = async (): Promise<any[]> => {
  try {
    const contests: any[] = [];
    const now = new Date();

    // Calculate next Saturday for ABC (9:00 PM JST = 5:30 PM IST)
    let nextSaturday = nextDay(now, 6); // 6 = Saturday
    nextSaturday = setHours(nextSaturday, 17); // 5:30 PM IST
    nextSaturday = setMinutes(nextSaturday, 30);
    if (isBefore(nextSaturday, now)) {
      nextSaturday = addWeeks(nextSaturday, 1); // Move to next Saturday
    }
    const abcNumber = Math.floor((nextSaturday.getTime() - new Date('2025-05-24').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 407;
    contests.push(normalizeContest({
      id: `abc${abcNumber}`,
      name: `AtCoder Beginner Contest ${abcNumber}`,
      startTime: nextSaturday,
      duration: formatDuration(100 * 60), // 100 minutes
      link: `https://atcoder.jp/contests/abc${abcNumber}`,
    }, 'AtCoder'));

    // Calculate next Sunday for ARC (9:00 PM JST = 5:30 PM IST)
    let nextSunday = nextDay(now, 0); // 0 = Sunday
    nextSunday = setHours(nextSunday, 17); // 5:30 PM IST
    nextSunday = setMinutes(nextSunday, 30);
    if (isBefore(nextSunday, now)) {
      nextSunday = addWeeks(nextSunday, 1); // Move to next Sunday
    }
    const arcNumber = Math.floor((nextSunday.getTime() - new Date('2025-05-25').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 198;
    contests.push(normalizeContest({
      id: `arc${arcNumber}`,
      name: `AtCoder Regular Contest ${arcNumber}`,
      startTime: nextSunday,
      duration: formatDuration(120 * 60), // 120 minutes
      link: `https://atcoder.jp/contests/arc${arcNumber}`,
    }, 'AtCoder'));

    console.log(`Generated ${contests.length} AtCoder contests`);
    return contests;
  } catch (error: any) {
    console.error('Error generating AtCoder contests:', error.message || error);
    return [];
  }
};

// Generate CodeChef contest manually
const fetchCodeChefContests = async (): Promise<any[]> => {
  try {
    const contests: any[] = [];
    const now = new Date();

    // Calculate next Saturday at 8:00 PM IST
    let nextSaturday = nextDay(now, 6); // 6 = Saturday
    nextSaturday = setHours(nextSaturday, 20); // 8:00 PM
    nextSaturday = setMinutes(nextSaturday, 0);
    if (isBefore(nextSaturday, now)) {
      nextSaturday = addWeeks(nextSaturday, 1); // Move to next Saturday
    }
    const weeksSinceBase = Math.floor((nextSaturday.getTime() - new Date('2025-05-24').getTime()) / (7 * 24 * 60 * 60 * 1000));
    const contestNumber = 187 + weeksSinceBase;

    contests.push(normalizeContest({
      id: `START${contestNumber}`,
      name: `CodeChef Starters ${contestNumber}`,
      startTime: nextSaturday,
      duration: formatDuration(120 * 60), // 120 minutes
      link: `https://www.codechef.com/START${contestNumber}`,
    }, 'CodeChef'));

    console.log(`Generated ${contests.length} CodeChef contests`);
    return contests;
  } catch (error: any) {
    console.error('Error generating CodeChef contests:', error.message || error);
    return [];
  }
};

// Generate GeeksforGeeks contest manually
const fetchGeeksforGeeksContests = async (): Promise<any[]> => {
  try {
    const contests: any[] = [];
    const now = new Date();

    // Calculate next Sunday at 7:00 PM IST
    let nextSunday = nextDay(now, 0); // 0 = Sunday
    nextSunday = setHours(nextSunday, 19); // 7:00 PM
    nextSunday = setMinutes(nextSunday, 0);
    if (isBefore(nextSunday, now)) {
      nextSunday = addWeeks(nextSunday, 1); // Move to next Sunday
    }
    const weeksSinceBase = Math.floor((nextSunday.getTime() - new Date('2025-05-25').getTime()) / (7 * 24 * 60 * 60 * 1000));
    const contestNumber = 208 + weeksSinceBase;

    contests.push(normalizeContest({
      id: `gfg-weekly-${contestNumber}`,
      name: `GfG Weekly - ${contestNumber} [Rated Contest]`,
      startTime: nextSunday,
      duration: formatDuration(90 * 60), // 90 minutes
      link: `https://practice.geeksforgeeks.org/contest/gfg-weekly-${contestNumber}-rated-contest`,
    }, 'GeeksforGeeks'));

    console.log(`Generated ${contests.length} GeeksforGeeks contests`);
    return contests;
  } catch (error: any) {
    console.error('Error generating GeeksforGeeks contests:', error.message || error);
    return [];
  }
};

// Fetch LeetCode contests
const fetchLeetCodeContests = async (): Promise<any[]> => {
  try {
    const response = await axiosInstance.post(
      'https://leetcode.com/graphql/',
      {
        query: `
          query upcomingContests {
            upcomingContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.data?.upcomingContests) {
      const contests = response.data.data.upcomingContests
        .slice(0, 2) // Ensure only 2 contests
        .map((contest: any) => normalizeContest({
          id: contest.titleSlug,
          name: contest.title,
          startTime: new Date(contest.startTime * 1000),
          duration: formatDuration(contest.duration), // Convert seconds to formatted duration
          link: `https://leetcode.com/contest/${contest.titleSlug}`,
        }, 'LeetCode'));
      console.log(`Fetched ${contests.length} LeetCode contests via API`);
      return contests;
    }
    throw new Error('No upcoming contests found in LeetCode API response');
  } catch (error: any) {
    console.error('Error fetching LeetCode contests via API:', error.message || error, error.response?.status || 'No status');
    return [];
  }
};

// Update contests in DB
export const updateContests = async (): Promise<void> => {
  let allContests: any[] = [];

  // Fetch contests
  const codeforcesContests = await fetchCodeforcesContests();
  const atCoderContests = await fetchAtCoderContests();
  const codeChefContests = await fetchCodeChefContests();
  const geeksforGeeksContests = await fetchGeeksforGeeksContests();
  const leetCodeContests = await fetchLeetCodeContests();

  allContests = allContests.concat(
    codeforcesContests,
    atCoderContests,
    codeChefContests,
    geeksforGeeksContests,
    leetCodeContests
  );

  if (allContests.length === 0) {
    console.log('No contests fetched from any platform');
  } else {
    console.log(`Fetched ${allContests.length} contests`);
  }

  // Update or insert fetched contests
  for (const c of allContests) {
    try {
      const existingContest = await contest.findOne({ id: c.id });
      if (!existingContest) {
        if (c.status === 'past') {
          c.solutions = await fetchYouTubeSolutions(c.name, c.platform);
        }
        await contest.create(c);
        console.log(`Created new contest: ${c.name} (${c.platform})`);
      } else {
        const isPast = hasContestEnded(existingContest.startTime, existingContest.duration);
        if (isPast && existingContest.status !== 'past') {
          existingContest.status = 'past';
          existingContest.solutions = await fetchYouTubeSolutions(existingContest.name, existingContest.platform);
          await existingContest.save();
          console.log(`Updated contest to past: ${existingContest.name} (${existingContest.platform})`);
        }
      }
    } catch (error: any) {
      console.error(`Error processing contest ${c.name}:`, error.message || error);
    }
  }

  // Update status of all existing contests and generate next manual contests
  const manualPlatforms = ['CodeChef', 'GeeksforGeeks', 'AtCoder'];
  const allDbContests = await contest.find({});
  for (const dbContest of allDbContests) {
    try {
      const isPast = hasContestEnded(dbContest.startTime, dbContest.duration);
      if (isPast && dbContest.status !== 'past') {
        dbContest.status = 'past';
        dbContest.solutions = await fetchYouTubeSolutions(dbContest.name, dbContest.platform);
        await dbContest.save();
        console.log(`Updated existing contest to past: ${dbContest.name} (${dbContest.platform})`);

        // Generate next contest for manual platforms
        if (manualPlatforms.includes(dbContest.platform)) {
          let nextContest: any = null;
          if (dbContest.platform === 'CodeChef') {
            const current = await fetchCodeChefContests();
            nextContest = current[0];
          } else if (dbContest.platform === 'GeeksforGeeks') {
            const current = await fetchGeeksforGeeksContests();
            nextContest = current[0];
          } else if (dbContest.platform === 'AtCoder') {
            const current = await fetchAtCoderContests();
            nextContest = current.find(c => c.id !== dbContest.id) || current[0]; // Pick ARC if ABC ended, or vice versa
          }

          if (nextContest) {
            const existingNext = await contest.findOne({ id: nextContest.id });
            if (!existingNext) {
              await contest.create(nextContest);
              console.log(`Created next contest: ${nextContest.name} (${nextContest.platform})`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`Error updating contest ${dbContest.name}:`, error.message || error);
    }
  }

  // Keep only 20 past contests
  try {
    const pastContests = await contest.find({ status: 'past' }).sort({ startTime: -1 });
    if (pastContests.length > 20) {
      const toDelete = pastContests.slice(20);
      await contest.deleteMany({ _id: { $in: toDelete.map(c => c._id) } });
      console.log(`Deleted ${toDelete.length} old past contests`);
    }
  } catch (error: any) {
    console.error('Error pruning past contests:', error.message || error);
  }

  console.log(`Contests updated: ${allContests.length} contests processed`);
};
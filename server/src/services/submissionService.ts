import axios from 'axios';
import { IUser } from '../models/user';
import UserActivity from '../models/userActivity';

interface Submission {
  problemId: string;
  platform: 'leetcode' | 'codeforces' | 'codechef';
  timestamp: number;
  problemTitle?: string;
}

interface DailySubmissionData {
  userId: string;
  date: string;
  submissions: Submission[];
  totalProblems: number;
  platformBreakdown: {
    leetcode: number;
    codeforces: number;
    codechef: number;
  };
}

async function fetchLeetCodeSubmissions(
  leetcodeHandle: string, 
  fromTimestamp: number, 
  toTimestamp: number
): Promise<Submission[]> {
 
  try {
    const query = `
      query recentSubmissions($username: String!) {
        recentSubmissionList(username: $username) {
          titleSlug
          timestamp
          title
          statusDisplay
        }
      }
    `;
    
    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username: leetcodeHandle },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    const submissions = response.data.data.recentSubmissionList || [];
    const filtered = submissions
      .filter((sub: any) => 
        sub.statusDisplay === 'Accepted' && 
        parseInt(sub.timestamp) >= fromTimestamp && 
        parseInt(sub.timestamp) <= toTimestamp
      )
      .map((sub: any) => ({
        problemId: sub.titleSlug,
        platform: 'leetcode' as const,
        timestamp: parseInt(sub.timestamp),
        problemTitle: sub.title,
      }));
    
   
    return filtered;
  } catch (error) {
    console.error(`LeetCode fetch error for ${leetcodeHandle}:`, error);
    return [];
  }
}

async function fetchCodeforcesSubmissions(
  codeforcesHandle: string, 
  fromTimestamp: number, 
  toTimestamp: number
): Promise<Submission[]> {
  console.log(`Fetching Codeforces submissions for ${codeforcesHandle} from ${new Date(fromTimestamp * 1000).toISOString()} to ${new Date(toTimestamp * 1000).toISOString()}`);
  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${codeforcesHandle}&from=1&count=10000`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (response.data.status !== 'OK') {
      throw new Error(response.data.comment);
    }

    const filtered = response.data.result
      .filter((sub: any) => 
        sub.verdict === 'OK' && 
        sub.creationTimeSeconds >= fromTimestamp && 
        sub.creationTimeSeconds <= toTimestamp
      )
      .map((sub: any) => ({
        problemId: `${sub.contestId}${sub.problem.index}`,
        platform: 'codeforces' as const,
        timestamp: sub.creationTimeSeconds,
        problemTitle: sub.problem.name,
      }));
    
    console.log(`Codeforces fetched ${filtered.length} OK submissions for ${codeforcesHandle}`);
    return filtered;
  } catch (error) {
    console.error(`Codeforces fetch error for ${codeforcesHandle}:`, error);
    return [];
  }
}

async function fetchCodeChefSubmissions(
  codechefHandle: string, 
  fromTimestamp: number, 
  toTimestamp: number
): Promise<Submission[]> {
  console.log(`Fetching CodeChef submissions for ${codechefHandle} from ${new Date(fromTimestamp * 1000).toISOString()} to ${new Date(toTimestamp * 1000).toISOString()}`);
  try {
    const response = await axios.get(`https://www.codechef.com/users/${codechefHandle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.status !== 200) {
      throw new Error(`CodeChef returned status ${response.status}`);
    }

    const data = response.data;
    const heatMapDataStart = data.search("var userDailySubmissionsStats =") + "var userDailySubmissionsStats =".length;
    const heatMapDataEnd = data.search("'#js-heatmap") - 34;
    
    if (heatMapDataStart === -1 || heatMapDataEnd === -1) {
      console.log('Could not find heatmap data in CodeChef response');
      return [];
    }

    const heatDataString = data.substring(heatMapDataStart, heatMapDataEnd);
    let heatMapData;
    try {
      heatMapData = JSON.parse(heatDataString);
    } catch (e) {
      console.error('Failed to parse CodeChef heatmap data:', e);
      return [];
    }
    
    const submissions: Submission[] = [];
    Object.entries(heatMapData).forEach(([dateStr, count]) => {
      const date = new Date(dateStr);
      const dayTimestamp = Math.floor(date.getTime() / 1000);
      
      if (dayTimestamp >= fromTimestamp && dayTimestamp <= toTimestamp && (count as number) > 0) {
        for (let i = 0; i < (count as number); i++) {
          submissions.push({
            problemId: `codechef-${dateStr}-${i}`,
            platform: 'codechef' as const,
            timestamp: dayTimestamp,
            problemTitle: `Problem solved on ${dateStr}`,
          });
        }
      }
    });

    
    return submissions;
  } catch (error) {
    console.error(`CodeChef fetch error for ${codechefHandle}:`, error);
    return [];
  }
}

export async function fetchUserDailySubmissions(
  user: IUser, 
  date: Date
): Promise<DailySubmissionData> {
  console.log(`Processing submissions for user ${user.username} (${user._id}) on ${date.toISOString().split('T')[0]}`);
  const targetDate = new Date(date);
  const fromTimestamp = Math.floor(targetDate.setHours(0, 0, 0, 0) / 1000);
  const toTimestamp = Math.floor(targetDate.setHours(23, 59, 59, 999) / 1000);

  const platforms = [
    { 
      handle: user.leetcodeUsername, 
      fetch: fetchLeetCodeSubmissions,
      platform: 'leetcode' as const
    },
    { 
      handle: user.codeforcesUsername, 
      fetch: fetchCodeforcesSubmissions,
      platform: 'codeforces' as const
    },
    { 
      handle: user.codechefUsername, 
      fetch: fetchCodeChefSubmissions,
      platform: 'codechef' as const
    },
  ];

  const allSubmissions: Submission[] = [];
  const platformBreakdown = {
    leetcode: 0,
    codeforces: 0,
    codechef: 0,
  };

  const fetchPromises = platforms.map(async ({ handle, fetch, platform }) => {
    if (!handle) {
    
      return [];
    }
    
    try {
      const submissions = await fetch(handle, fromTimestamp, toTimestamp);
      platformBreakdown[platform] = submissions.length;
      return submissions;
    } catch (error) {
      console.error(`Error fetching ${platform} data for ${handle}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allSubmissions.push(...result.value);
      
    } else {
      console.error(`Failed to fetch from ${platforms[index].platform}:`, result.reason);
    }
  });

  const uniqueSubmissions = Array.from(
    new Map(
      allSubmissions.map(sub => [`${sub.platform}-${sub.problemId}`, sub])
    ).values()
  );

  const submissionData: DailySubmissionData = {
    userId: user.id || user._id?.toString() || '',
    date: targetDate.toISOString().split('T')[0],
    submissions: uniqueSubmissions,
    totalProblems: uniqueSubmissions.length,
    platformBreakdown,
  };

  
  return submissionData;
}

export async function storeDailySubmissions(
  submissionData: DailySubmissionData
): Promise<boolean> {
 
  try {
    const dateObj = new Date(submissionData.date);
    
    const result = await UserActivity.findOneAndUpdate(
      { 
        userId: submissionData.userId, 
        date: dateObj
      },
      {
        userId: submissionData.userId,
        date: dateObj,
        count: submissionData.totalProblems
      },
      { upsert: true, new: true }
    );
    
   
    return true;
  } catch (error) {
    console.error('Error storing daily submissions:', error);
    return false;
  }
}
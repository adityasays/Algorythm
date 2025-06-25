import axios from "axios";
import { JSDOM } from "jsdom";
import { setTimeout } from "timers/promises";

const retry = async <T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Retry ${i + 1}/${retries} failed: ${err}`);
      await setTimeout(delay * Math.pow(2, i));
    }
  }
  throw new Error("Max retries reached");
};

const isValidUsername = (username: string): boolean => {
  if (!username || username.trim() === "") return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  return usernameRegex.test(username);
};

export const getCodeforcesRating = async (username: string): Promise<number> => {
  if (!isValidUsername(username)) {
    console.log(`Invalid Codeforces username: ${username}`);
    return 0;
  }

  try {
    const res = await retry(() =>
      axios.get(`https://codeforces.com/api/user.info?handles=${username}`, { timeout: 5000 })
    );
    if (res.data.status !== "OK") {
      console.log(`Codeforces user not found: ${username}`);
      return 0;
    }
    return res.data.result[0].rating || 0;
  } catch (err) {
    console.log(`Failed to fetch Codeforces rating for ${username}:`, err);
    return 0;
  }
};

export const getLeetcodeRating = async (username: string): Promise<number> => {
  if (!isValidUsername(username)) {
    console.log(`Invalid LeetCode username: ${username}`);
    return 0;
  }

  try {
    const query = `
      query getUserContestRanking($username: String!) {
        userContestRanking(username: $username) {
          rating
        }
      }
    `;
    const variables = { username };
    const res = await retry(() =>
      axios.post("https://leetcode.com/graphql", { query, variables }, { timeout: 5000 })
    );
    return Math.round(res.data.data.userContestRanking?.rating || 0);
  } catch (err) {
    console.log(`Failed to fetch LeetCode rating for ${username}:`, err);
    return 0;
  }
};

export const getCodechefRating = async (username: string): Promise<number> => {
  if (!isValidUsername(username)) {
    console.log(`Invalid CodeChef username: ${username}`);
    return 0;
  }

  try {
    const res = await retry(() =>
      axios.get(`https://www.codechef.com/users/${username}`, {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
    );

    if (res.status !== 200) {
      console.log(`CodeChef user not found: ${username}`);
      return 0;
    }

    const dom = new JSDOM(res.data);
    const document = dom.window.document;
    const ratingText = document.querySelector(".rating-number")?.textContent;
    const rating = ratingText ? parseInt(ratingText) : 0;

    if (!rating || isNaN(rating)) {
      console.log(`Invalid or missing CodeChef rating for ${username}`);
      return 0;
    }

    console.log(`Successfully fetched CodeChef rating for ${username}: ${rating}`);
    return rating;
  } catch (err: any) {
    if (err.response) {
      console.log(`CodeChef scraping error for ${username}: Status ${err.response.status}`);
    } else if (err.request) {
      console.log(`CodeChef request failed for ${username}: No response received`);
    } else {
      console.log(`Failed to fetch CodeChef rating for ${username}: ${err.message || err}`);
    }
    return 0;
  }
};
import { Request, Response } from "express";
import User from "../models/user";

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collegeName } = req.body;

    // Validate collegeName
    if (!collegeName || typeof collegeName !== "string") {
      res.status(400).json({ message: "College name is required and must be a string." });
      return;
    }

    // Fetch college-specific leaderboards
    const codeforcesLeaderboard = await User.find({ collegeName })
      .select("username collegeName codeforcesUsername   name ratings compositeScore")
      .sort({ "ratings.codeforces": -1 })
      .lean();

    const codechefLeaderboard = await User.find({ collegeName })
      .select("username name collegeName codechefUsername ratings compositeScore")
      .sort({ "ratings.codechef": -1 })
      .lean();

    const leetcodeLeaderboard = await User.find({ collegeName })
      .select("username collegeName leetcodeUsername  name ratings compositeScore")
      .sort({ "ratings.leetcode": -1 })
      .lean();

    // Fetch platform-wide leaderboard
    const platformLeaderboard = await User.find({})
      .select("username collegeName name ratings compositeScore")
      .sort({ compositeScore: -1 })
      .lean();

    // Combine results
    const leaderboards = {
      codeforces: codeforcesLeaderboard,
      codechef: codechefLeaderboard,
      leetcode: leetcodeLeaderboard,
      platform: platformLeaderboard
    };

    // Check if any leaderboard has data
    if (
      leaderboards.codeforces.length === 0 &&
      leaderboards.codechef.length === 0 &&
      leaderboards.leetcode.length === 0 &&
      leaderboards.platform.length === 0
    ) {
      res.status(404).json({ message: "No users found." });
      return;
    }

    res.status(200).json(leaderboards);
  } catch (err) {
    console.error("Error in getLeaderboard:", err);
    res.status(500).json({ message: "Server error" });
  }
};
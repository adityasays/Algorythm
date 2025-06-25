import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import Blog, { IBlog } from '../models/blog';
import UserActivity, { IUserActivity } from '../models/userActivity';

// Fetch user profile by username
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const user: IUser | null = await User.findOne({ username }).select('-password -email').lean();
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      username: user.username,
      name: user.name,
      collegeName: user.collegeName,
      codeforcesUsername: user.codeforcesUsername,
      codechefUsername: user.codechefUsername,
      leetcodeUsername: user.leetcodeUsername,
      ratings: user.ratings,
      compositeScore: user.compositeScore,
      potdSolved: user.potdSolved,
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      blogCount: user.blogCount,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch user blogs by username
export const getUserBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const user: IUser | null = await User.findOne({ username }).lean();
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const blogs: IBlog[] = await Blog.find({ author: user._id })
      .sort({ publishedAt: -1 })
      .lean();

    res.json(
      blogs.map((blog) => ({
        id: (blog._id as any).toString(),
        title: blog.title,
        excerpt: blog.excerpt,
        publishedAt: blog.publishedAt, // Use publishedAt instead of createdAt
        views: 0, // Default to 0 since views is not in Blog model
        likes: blog.likes || 0,
        readTime: blog.readTime,
        tags: blog.tags,
      }))
    );
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch user activity by username (for heatmap)
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const user: IUser | null = await User.findOne({ username }).lean();
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const activity: IUserActivity[] = await UserActivity.find({ userId: user._id })
      .select('date count')
      .lean();

    res.json(
      activity.map((act) => ({
        date: act.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        count: act.count,
      }))
    );
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Blog from '../models/blog';
import User from '../models/user';
import { AuthRequest } from '../middlewares/auth';

// Interface for populated author
interface PopulatedAuthor {
  _id: mongoose.Types.ObjectId;
  username: string;
  name: string;
}

// Interface for blog with populated author
interface BlogWithAuthor {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: PopulatedAuthor;
  createdAt: Date;
  publishedAt: Date;
  tags: string[];
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  readTime: string;
  keywords: string[];
}

// GET /api/blogs - Fetch all blogs with optional filters
export const getBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, sortBy } = req.query;
    const query: any = {};

    if (category && typeof category === 'string') {
      query.category = category;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions: any = {};
    if (sortBy === 'popular') {
      sortOptions.likes = -1;
    } else {
      sortOptions.publishedAt = -1;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username name')
      .sort(sortOptions)
      .lean() as unknown as BlogWithAuthor[];

    const userId = (req as AuthRequest).user?.id;

    res.json(
      blogs.map(blog => ({
        _id: blog._id.toString(),
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        category: blog.category,
        author: { name: blog.author.name, username: blog.author.username },
        createdAt: blog.createdAt.toISOString(),
        publishedAt: blog.publishedAt.toISOString(),
        tags: blog.tags,
        likes: blog.likes,
        readTime: blog.readTime,
        isLiked: userId ? blog.likedBy.some(id => id.equals(userId)) : false,
      }))
    );
  } catch (error) {
    
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/blogs/:id - Fetch a single blog by ID
export const getBlogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username name')
      .lean() as unknown as BlogWithAuthor | null;

    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }

    const userId = (req as AuthRequest).user?.id;

    res.json({
      _id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      author: { name: blog.author.name, username: blog.author.username },
      createdAt: blog.createdAt.toISOString(),
      publishedAt: blog.publishedAt.toISOString(),
      tags: blog.tags,
      likes: blog.likes,
      readTime: blog.readTime,
      isLiked: userId ? blog.likedBy.some(id => id.equals(userId)) : false,
    });
  } catch (error) {
    console.error('Fetch blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/blogs - Create a new blog
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, readTime, tags } = req.body;

    if (!title?.trim() || !content?.trim() || !category?.trim()) {
      res.status(400).json({ message: 'Title, content, and category are required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const excerpt = content.replace(/<[^>]*>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '');
    const keywords = tags || [];

    const blog = new Blog({
      title,
      content,
      excerpt,
      category,
      readTime: readTime ? `${readTime} min read` : '5 min read',
      tags: tags || [],
      keywords,
      author: req.user.id,
      publishedAt: new Date(),
      likes: 0,
      likedBy: [],
    });

    await blog.save();

    // Update user's blogCount and blogsPosted
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { blogCount: 1 },
      $push: { blogsPosted: blog._id },
    });

    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'username name')
      .lean() as unknown as BlogWithAuthor | null;

    if (!populatedBlog) {
      res.status(500).json({ message: 'Failed to create blog' });
      return;
    }

    res.status(201).json({
      _id: populatedBlog._id.toString(),
      title: populatedBlog.title,
      content: populatedBlog.content,
      excerpt: populatedBlog.excerpt,
      category: populatedBlog.category,
      author: { name: populatedBlog.author.name, username: populatedBlog.author.username },
      createdAt: populatedBlog.createdAt.toISOString(),
      publishedAt: populatedBlog.publishedAt.toISOString(),
      tags: populatedBlog.tags,
      likes: populatedBlog.likes,
      readTime: populatedBlog.readTime,
      isLiked: false,
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/blogs/:id/like - Toggle like status
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      res.status(404).json({ message: 'Blog not found' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isAlreadyLiked = blog.likedBy.some(id => id.equals(userId));

    if (isAlreadyLiked) {
      blog.likedBy = blog.likedBy.filter(id => !id.equals(userId));
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();
    res.json({ likes: blog.likes, isLiked: !isAlreadyLiked });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
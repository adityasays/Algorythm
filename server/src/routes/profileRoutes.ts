import { Router } from 'express';
import { getUserProfile, getUserBlogs, getUserActivity } from '../controllers/profileController';

const router: Router = Router();

// Routes for user profile data
router.get('/username/:username', getUserProfile);

// Routes for user blogs
router.get('/username/:username/blogs', getUserBlogs);

// Routes for user activity (heatmap)
router.get('/username/:username/activity', getUserActivity);

export default router;
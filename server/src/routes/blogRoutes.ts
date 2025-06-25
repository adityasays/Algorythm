import express, { Router, Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth';
import {
  getBlogs,
  createBlog,
  toggleLike,
  getBlogById,
} from '../controllers/blogController';

const router: Router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
  console.log('GET /api/blogs route hit', { query: req.query });
  next();
}, getBlogs);

router.get('/:id', (req: Request, res: Response, next: NextFunction): void => {
  console.log('GET /api/blogs/:id route hit', { params: req.params });
  next();
}, getBlogById);

router.post('/', (req: Request, res: Response, next: NextFunction): void => {
  console.log('POST /api/blogs route hit', { body: req.body });
  next();
}, verifyToken, createBlog);

router.post('/:id/like', (req: Request, res: Response, next: NextFunction): void => {
  console.log('POST /api/blogs/:id/like route hit', { params: req.params });
  next();
}, verifyToken, toggleLike);

export default router;
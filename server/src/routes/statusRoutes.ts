import express, { Router, Response } from "express";
import { verifyToken, AuthRequest } from "../middlewares/auth";

const router: Router = express.Router();

router.get("/me", verifyToken, (req: AuthRequest, res: Response): void => {
  res.json({
    loggedIn: true,
    user: req.user
  });
});

export default router;
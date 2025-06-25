import express, { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboardController";

const router: Router = express.Router();

router.post("/", getLeaderboard);

export default router;
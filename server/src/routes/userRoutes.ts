import express, { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import { getProfile } from "../controllers/userController";

const router: Router = express.Router();

router.get("/me", verifyToken, getProfile);

export default router;
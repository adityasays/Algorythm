import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import User from "../models/user";

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

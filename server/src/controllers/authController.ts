import { Request, Response } from "express";
import { CookieOptions } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getCodechefRating, getCodeforcesRating, getLeetcodeRating } from "../utils/fetchratings";


const cookieOptions: CookieOptions = {
  httpOnly: true,                      
  secure: process.env.NODE_ENV === "production", 
  sameSite: "lax",                    
  maxAge: 60 * 60 * 1000,             
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    username,
    collegeName,
    email,
    codeforcesUsername,
    codechefUsername,
    leetcodeUsername,
    password,
  } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: "Email or username already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      collegeName,
      email,
      codeforcesUsername,
      codechefUsername,
      leetcodeUsername,
      password: hashedPassword,
    });

    await newUser.save();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const payload = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "User registered and logged in successfully",
      user: {
        username: newUser.username,
        collegeName: newUser.collegeName,
        name: newUser.name,
        email: newUser.email,
        codeforcesUsername: newUser.codeforcesUsername,
        codechefUsername: newUser.codechefUsername,
        leetcodeUsername: newUser.leetcodeUsername,
        id: newUser._id,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { usernameOrEmail, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        collegeName: user.collegeName,
        codeforcesUsername: user.codeforcesUsername,
        codechefUsername: user.codechefUsername,
        leetcodeUsername: user.leetcodeUsername,
         

      },

    }); console.log(user)
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

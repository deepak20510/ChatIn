import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken, clearCookieOptions } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // 1. Input Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (fullName.trim().length < 2) {
      return res.status(400).json({ message: "Full name must be at least 2 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Ensure Database Connection is active
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          message:
            "Database connection failed. Please ensure MongoDB is running or update MONGO_URI in backend/.env with your MongoDB Atlas connection string.",
        });
      }
    }

    // 3. Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 4. Hash Password & Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();

    // 5. Generate JWT Token
    const token = generateToken(savedUser._id, res);

    // 6. Return response immediately to client
    res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      profilePic: savedUser.profilePic,
      token,
    });

    // 7. Send Welcome Email in background (fire-and-forget, never blocks client response)
    if (ENV.RESEND_API_KEY) {
      sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL).catch((err) => {
        console.error("[EMAIL] Welcome email sending error:", err?.message || err);
      });
    }
  } catch (error) {
    console.error("Error in signup controller:", error);

    if (res.headersSent) return;

    // Handle MongoDB duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: error.message || "Internal server error during registration",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Ensure Database Connection is active
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          message:
            "Database connection failed. Please ensure MongoDB is running or update MONGO_URI in backend/.env with your MongoDB Atlas connection string.",
        });
      }
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || "Internal server error during login",
      });
    }
  }
};

export const logout = (_, res) => {
  res.clearCookie("jwt", clearCookieOptions());
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Guard: reject base64 images that are too large (>4MB base64 = ~3MB actual)
    // Prevents Cloudinary bandwidth overrun and long upload times
    const MAX_BASE64_SIZE = 4 * 1024 * 1024; // 4MB
    if (profilePic.length > MAX_BASE64_SIZE) {
      return res.status(413).json({ message: "Profile picture must be smaller than 3MB. Please compress the image first." });
    }

    const userId = req.user._id;
    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      folder: "chatin_avatars",
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select("-password").lean();

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
};

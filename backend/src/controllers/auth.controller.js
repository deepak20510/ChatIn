import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import { authLogger } from "../lib/logger.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // check if emailis valid: regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // 123456 => $dnjasdkasj_?dmsakmk
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      const savedUser = await newUser.save();
      generateToken(savedUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      try {
        await sendWelcomeEmail(
          savedUser.email,
          savedUser.fullName,
          ENV.CLIENT_URL,
        );
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid Credentials" });

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const logout = (_, res) => {
  res.clearCookie("jwt", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.status(200).json({ message: "Logged out sucessfully" });
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { JWT_SECRET } = ENV;

    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured - cannot refresh token");
      return res.status(500).json({ message: "Internal server error" });
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.log("⚠️  No refresh token provided");
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== "refresh") {
      authLogger.invalidTokenType(decoded.userId, decoded.type);
      console.warn("⚠️  Invalid token type in refresh request");
      return res.status(401).json({ message: "Invalid token type" });
    }

    // Fetch user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      authLogger.unauthorizedAccess({
        reason: "User not found during refresh",
      });
      console.warn(`⚠️  User not found for refresh: ${decoded.userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token only
    const newAccessToken = jwt.sign(
      { userId: user._id, type: "access" },
      JWT_SECRET,
      { expiresIn: "15m" },
    );

    const isProduction = ENV.NODE_ENV === "production";

    res.cookie("jwt", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    authLogger.tokenRefreshed(user._id);
    console.log(`✅ Access token refreshed for user: ${user._id}`);

    res.status(200).json({
      message: "Token refreshed successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    authLogger.refreshAttempt(null, false, error.message);
    console.error(`❌ Token refresh failed: ${error.message}`);

    if (error.name === "JsonWebTokenError") {
      authLogger.jwtVerificationFailed(error, { context: "refresh_verify" });
      console.warn("❌ Invalid refresh token signature");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (error.name === "TokenExpiredError") {
      authLogger.sessionInvalidated(
        null,
        "Refresh token expired during refresh",
      );
      console.warn("⏰ Refresh token expired - user must login again");
      res.clearCookie("jwt", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });
      return res
        .status(401)
        .json({ message: "Refresh token expired - please login again" });
    }

    authLogger.jwtVerificationFailed(error, { context: "refresh_unknown" });
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic)
      return res.status(400).json({ message: "Profile pic is required" });
    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true },
    );
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

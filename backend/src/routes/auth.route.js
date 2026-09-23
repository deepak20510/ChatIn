import express from "express";
import jwt from "jsonwebtoken";
import {
  signup,
  login,
  logout,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { slideTokenCookie, clearCookieOptions } from "../lib/utils.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

// Auth check — cleanly checks session without generating 401 console noise for unauthenticated visitors
router.get("/check", async (req, res) => {
  try {
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(200).json(null);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      res.clearCookie("jwt", clearCookieOptions());
      return res.status(200).json(null);
    }

    // Ensure database connection before querying
    if (User.db.readyState !== 1) {
      return res.status(200).json(null);
    }

    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) {
      res.clearCookie("jwt", clearCookieOptions());
      return res.status(200).json(null);
    }

    slideTokenCookie(token, res);

    res.status(200).json({
      ...user,
      token,
    });
  } catch (err) {
    console.error("[AUTH-CHECK] Error:", err.message);
    res.status(200).json(null);
  }
});

export default router;

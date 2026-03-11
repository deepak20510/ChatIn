import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("=== AUTH MIDDLEWARE DEBUG ===");
    console.log("Request URL:", req.url);
    console.log("Request Origin:", req.headers.origin);
    console.log("All Cookies:", req.cookies);
    console.log("Raw Cookie Header:", req.headers.cookie);

    // Check for JWT token in cookies
    const token = req.cookies.jwt;
    if (!token) {
      console.log("❌ No JWT cookie found");
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    console.log("✅ JWT token found");

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      console.log("❌ Invalid token");
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log("✅ Token decoded, userId:", decoded.userId);

    // Fetch user and exclude password
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("❌ User not found for ID:", decoded.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log("❌ Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Token expired" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Enhanced debugging for production
    console.log("=== AUTH MIDDLEWARE DEBUG ===");
    console.log("Request URL:", req.url);
    console.log("Request Method:", req.method);
    console.log("Request Origin:", req.headers.origin);
    console.log("All Cookies:", req.cookies);
    console.log("Raw Cookie Header:", req.headers.cookie);
    console.log("User-Agent:", req.headers['user-agent']);
    console.log("================================");

    // Check for JWT token in cookies
    const token = req.cookies.jwt;
    if (!token) {
      console.log("❌ Auth Guard - No JWT cookie found");
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    console.log("✅ JWT token found, length:", token.length);

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      console.log("❌ Auth Guard - Invalid token");
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log("✅ Token decoded successfully, userId:", decoded.userId);

    // Fetch user and exclude password
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("❌ Auth Guard - User not found for ID:", decoded.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log("❌ Error in protectRoute middleware:", error.message);

    if (error.name === "JsonWebTokenError") {
      console.log("❌ JWT Verification Error:", error.message);
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      console.log("❌ JWT Token Expired:", error.message);
      return res.status(401).json({ message: "Unauthorized - Token expired" });
    }

    console.log("❌ Unknown error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

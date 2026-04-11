import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { slideTokenCookie } from "../lib/utils.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Throws JsonWebTokenError or TokenExpiredError on failure
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sliding-window: re-set the cookie maxAge on every authenticated request
    // so active users never get logged out. No re-signing needed.
    slideTokenCookie(token, res);

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized - Session expired, please login again" });
    }

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid token" });
    }

    console.error("Auth middleware error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { slideTokenCookie, clearCookieOptions } from "../lib/utils.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Support both HttpOnly cookie OR Bearer token strategies dynamically
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) {
      // Clear cookie if user was deleted or no longer exists
      res.clearCookie("jwt", clearCookieOptions());
      return res.status(401).json({ message: "Unauthorized - User no longer exists" });
    }

    // Keep session alive
    slideTokenCookie(token, res);

    req.user = user;
    next();
  } catch (error) {
    res.clearCookie("jwt", clearCookieOptions());

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
    if (!res.headersSent) {
      res.status(401).json({ message: "Unauthorized - Authentication failed" });
    }
  }
};

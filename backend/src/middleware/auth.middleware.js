import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Debug: Log cookies and headers
    console.log("Auth Guard - Cookies:", Object.keys(req.cookies));
    console.log(
      "Auth Guard - Authorization header:",
      req.headers.authorization,
    );

    // Check for JWT token in cookies
    const token = req.cookies.jwt;
    if (!token) {
      console.log("Auth Guard - No JWT cookie found");
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      console.log("Auth Guard - Invalid token");
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Fetch user and exclude password
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("Auth Guard - User not found");
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Token expired" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Safely parse token from explicitly passed auth object (preferred) OR fallback to cookie
    let token = socket.handshake.auth?.token;
    
    if (!token) {
      const rawCookie = socket.handshake.headers.cookie || "";
      const jwtCookie = rawCookie
        .split("; ")
        .find((row) => row.startsWith("jwt="));

      token = jwtCookie ? jwtCookie.slice("jwt=".length) : null;
    }

    if (!token) {
      return next(new Error("Unauthorized - No token provided"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user info to socket
    socket.user = user;
    socket.userId = user._id.toString();

    console.log(`Socket authenticated: ${user.fullName} (${socket.userId})`);

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("Unauthorized - Session expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Unauthorized - Invalid token"));
    }
    console.error("Socket auth error:", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};

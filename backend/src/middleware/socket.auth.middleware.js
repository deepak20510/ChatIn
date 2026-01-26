import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    // extract token from http-only cookies
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];

    if (!token) {
      console.log("Socket connection rejected: No token provided");
      return next(new Error("Unauthorized - No Token Provided"));
    }

    // verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Unauthorized - Invalid Token"));
    }

    // find user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next(new Error("User not found"));
    }

    // attach user to socket
    socket.user = user;
    socket.userId = user._id.toString();

    console.log(
      `Socket authenticated: ${user.fullName} (${socket.userId})`
    );

    // ✅ REQUIRED
    next();
  } catch (error) {
    console.log("Socket auth error:", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};

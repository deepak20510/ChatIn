import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

// Token expiration times
export const TOKEN_EXPIRY = {
  ACCESS: "15m", // Short-lived access token
  REFRESH: "30d", // Long-lived refresh token
};

export const generateToken = (userId, res) => {
  const { JWT_SECRET, NODE_ENV } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Generate short-lived access token
  const accessToken = jwt.sign({ userId, type: "access" }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.ACCESS,
  });

  // Generate long-lived refresh token
  const refreshToken = jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.REFRESH,
  });

  const isProduction = NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  // Set access token cookie (15 minutes)
  res.cookie("jwt", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set refresh token cookie (30 days)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  console.log(`✅ Tokens generated for user: ${userId}`);

  return { accessToken, refreshToken };
};

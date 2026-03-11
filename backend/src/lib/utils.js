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

  const isProduction = NODE_ENV === "production";

  console.log("=== TOKEN GENERATION DEBUG ===");
  console.log("User ID:", userId);
  console.log("NODE_ENV:", NODE_ENV);
  console.log("Is Production:", isProduction);

  // For now, use simple long-lived tokens to avoid refresh complexity
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // More permissive cookie settings for cross-domain
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // Add domain for production
    ...(isProduction && { domain: ".onrender.com" })
  };

  console.log("Cookie options:", cookieOptions);

  // Set main JWT cookie
  res.cookie("jwt", token, cookieOptions);

  // ALSO set as a backup header for debugging
  res.setHeader('X-Auth-Token', token);

  console.log("✅ Cookie and header set");
  console.log("===============================");

  return token;
};

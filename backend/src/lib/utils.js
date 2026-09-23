import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

// Non-expiring persistent sessions (10 years)
const TOKEN_MAX_AGE_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in ms
const TOKEN_EXPIRY = "3650d";

/**
 * Build the cookie options object based on the current environment.
 */
export function buildCookieOptions() {
  const isProduction = ENV.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_MS,
  };
}

/**
 * Standard cookie clear options matching buildCookieOptions flags
 */
export function clearCookieOptions() {
  const isProduction = ENV.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
}

/**
 * Sign a NEW persistent token for userId and set it as an httpOnly cookie.
 * Non-expirable session.
 */
export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  if (res && !res.headersSent) {
    res.cookie("jwt", token, buildCookieOptions());
  }

  return token;
};

/**
 * Sliding-window refresh: re-set the token in the cookie with fresh maxAge.
 */
export const slideTokenCookie = (token, res) => {
  if (res && !res.headersSent) {
    res.cookie("jwt", token, buildCookieOptions());
  }
};

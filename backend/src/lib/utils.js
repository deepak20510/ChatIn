import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

// Token lives for 365 days. As long as the user is active, the sliding
// window in auth.middleware.js will keep re-setting the cookie maxAge, so
// they will never get logged out while using the app.
const TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 365 days in ms
const TOKEN_EXPIRY = "365d";

/**
 * Build the cookie options object based on the current environment.
 * Kept in one place so generateToken and refreshTokenCookie are consistent.
 */
function buildCookieOptions() {
  const isProduction = ENV.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,         // HTTPS only in production
    sameSite: isProduction ? "none" : "lax", // cross-domain in production
    path: "/",
    maxAge: TOKEN_MAX_AGE_MS,
  };
}

/**
 * Sign a NEW token for userId and set it as an httpOnly cookie.
 * Called on signup / login.
 */
export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  res.cookie("jwt", token, buildCookieOptions());

  return token;
};

/**
 * Sliding-window refresh: re-set the SAME token string in the cookie with a
 * fresh maxAge. This does NOT re-sign the token (no DB hit, no extra CPU),
 * it just keeps the cookie alive as long as the user is active.
 * Called from auth.middleware.js on every authenticated request.
 */
export const slideTokenCookie = (token, res) => {
  res.cookie("jwt", token, buildCookieOptions());
};

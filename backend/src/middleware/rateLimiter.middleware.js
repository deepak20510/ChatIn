import rateLimit from "express-rate-limit";

// Rate limit helper to return consistent JSON error response
const createLimiterResponse = (message) => ({
  status: 429,
  message,
});

/**
 * Strict rate limiter for Authentication endpoints (login, signup)
 * 10 failed attempts per 15 minutes per IP to prevent brute-force attacks
 * Successful logins are not counted against the limit.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true, // Only count failed logins/signups
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimiterResponse("Too many failed authentication attempts. Please try again after 15 minutes."),
});

/**
 * General API rate limiter for standard endpoints (rooms, contacts, chats)
 * 150 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimiterResponse("API rate limit exceeded. Please slow down."),
});

/**
 * Message sending limiter
 * 45 messages per minute per IP to prevent spamming
 */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimiterResponse("You are sending messages too quickly. Please wait a moment."),
});

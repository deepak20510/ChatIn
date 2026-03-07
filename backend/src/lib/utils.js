import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET, NODE_ENV } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = NODE_ENV === "production";

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction,           // true in production, false in development
    sameSite: isProduction ? "none" : "lax",  // "none" for cross-domain in production
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return token;
};
import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // For cross-domain (Vercel to Render), use sameSite=none + secure=true
  const isDevelopment =
    !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isDevelopment ? "lax" : "none",
    secure: !isDevelopment,
    path: "/",
  });

  return token;
};

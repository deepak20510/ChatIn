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

  // For production (cross-domain), use SameSite=None with Secure
  // For development, use SameSite=Lax
  const isProduction = NODE_ENV === "production";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction, // must be true when sameSite=none
    domain: isProduction ? undefined : undefined, // let browser handle domain
  });

  return token;
};

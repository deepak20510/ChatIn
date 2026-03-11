import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { authLogger } from "../lib/logger.js";

export const protectRoute = async (req, res, next) => {
  try {
    const { JWT_SECRET, NODE_ENV } = ENV;

    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({ message: "Internal server error" });
    }

    // Check for JWT token in cookies
    let token = req.cookies.jwt;

    if (!token) {
      authLogger.unauthorizedAccess({ reason: "No JWT cookie" });
      console.log("⚠️  No JWT cookie found - access denied");
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Try to verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // If token is expired, try to refresh it
      if (error.name === "TokenExpiredError") {
        authLogger.tokenExpired(null, "access");
        console.log("⏰ Access token expired - attempting refresh...");

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
          authLogger.unauthorizedAccess({
            reason: "Token expired, no refresh token",
          });
          console.log("❌ No refresh token available");
          return res
            .status(401)
            .json({
              message: "Unauthorized - Token expired, please login again",
            });
        }

        try {
          const refreshDecoded = jwt.verify(refreshToken, JWT_SECRET);

          if (refreshDecoded.type !== "refresh") {
            authLogger.invalidTokenType(
              refreshDecoded.userId,
              refreshDecoded.type,
            );
            console.warn("❌ Invalid refresh token type");
            return res.status(401).json({ message: "Invalid token" });
          }

          // Generate new access token
          const newAccessToken = jwt.sign(
            { userId: refreshDecoded.userId, type: "access" },
            JWT_SECRET,
            { expiresIn: "15m" },
          );

          const isProduction = NODE_ENV === "production";

          res.cookie("jwt", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
          });

          console.log(
            `✅ Access token auto-refreshed for user: ${refreshDecoded.userId}`,
          );

          decoded = refreshDecoded;
        } catch (refreshError) {
          console.error(
            `❌ Refresh token verification failed: ${refreshError.message}`,
          );

          if (refreshError.name === "TokenExpiredError") {
            authLogger.sessionInvalidated(null, "Refresh token expired");
            console.warn("⏰ Refresh token expired - full re-login required");
            res.clearCookie("jwt", { path: "/" });
            res.clearCookie("refreshToken", { path: "/" });
          } else {
            authLogger.jwtVerificationFailed(refreshError, {
              context: "refresh",
            });
          }

          return res.status(401).json({
            message: "Unauthorized - Session expired, please login again",
          });
        }
      } else if (error.name === "JsonWebTokenError") {
        authLogger.jwtVerificationFailed(error, {
          context: "access_token_verify",
        });
        console.error(`❌ JWT verification failed: ${error.message}`);
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid token" });
      } else {
        authLogger.jwtVerificationFailed(error, { context: "unknown" });
        console.error(`❌ Token verification error: ${error.message}`);
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    if (!decoded) {
      console.log("❌ Unable to decode token");
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Fetch user and exclude password
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.warn(`❌ User not found for ID: ${decoded.userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`❌ Unhandled error in protectRoute: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

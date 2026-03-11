import { ENV } from "./env.js";

// JWT and Auth event logger for production monitoring
export const authLogger = {
  // Log successful token operations
  tokenGenerated: (userId, tokenType = "access") => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ✅ TOKEN_GENERATED userId=${userId} type=${tokenType}`,
    );
    if (ENV.NODE_ENV === "production") {
      // In production, send to logging service
      logToMonitoring("TOKEN_GENERATED", {
        userId,
        tokenType,
        timestamp,
      });
    }
  },

  tokenRefreshed: (userId) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 TOKEN_REFRESHED userId=${userId}`);
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("TOKEN_REFRESHED", { userId, timestamp });
    }
  },

  // Log JWT verification failures
  jwtVerificationFailed: (error, context = {}) => {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] ❌ JWT_VERIFICATION_FAILED error=${error.message} context=${JSON.stringify(context)}`,
    );
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("JWT_VERIFICATION_FAILED", {
        error: error.message,
        errorName: error.name,
        context,
        timestamp,
      });
    }
  },

  tokenExpired: (userId, tokenType = "access") => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] ⏰ TOKEN_EXPIRED userId=${userId} type=${tokenType}`,
    );
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("TOKEN_EXPIRED", { userId, tokenType, timestamp });
    }
  },

  invalidTokenType: (userId, receivedType) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] ⚠️  INVALID_TOKEN_TYPE userId=${userId} receivedType=${receivedType}`,
    );
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("INVALID_TOKEN_TYPE", {
        userId,
        receivedType,
        timestamp,
      });
    }
  },

  refreshAttempt: (userId, success, reason = null) => {
    const timestamp = new Date().toISOString();
    const status = success ? "✅ SUCCESS" : "❌ FAILED";
    console.log(
      `[${timestamp}] 🔄 REFRESH_ATTEMPT userId=${userId} status=${status} reason=${reason || "N/A"}`,
    );
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("REFRESH_ATTEMPT", {
        userId,
        success,
        reason,
        timestamp,
      });
    }
  },

  sessionInvalidated: (userId, reason) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] 🚫 SESSION_INVALIDATED userId=${userId} reason=${reason}`,
    );
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("SESSION_INVALIDATED", {
        userId,
        reason,
        timestamp,
      });
    }
  },

  unauthorizedAccess: (context = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] 🔐 UNAUTHORIZED_ACCESS context=${JSON.stringify(context)}`,
    );
    if (ENV.NODE_ENV === "production") {
      logToMonitoring("UNAUTHORIZED_ACCESS", {
        context,
        timestamp,
      });
    }
  },
};

// Helper function to send logs to monitoring service
// You can replace this with actual monitoring service (e.g., Sentry, DataDog, etc.)
const logToMonitoring = (eventName, data) => {
  // TODO: Integrate with your monitoring service
  // Example: sentry.captureMessage(eventName, { extra: data });
  // Example: datadog.logger.log({ event: eventName, data });
};

export default authLogger;

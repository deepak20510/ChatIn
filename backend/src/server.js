import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import roomRoutes from "./routes/room.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { seedDefaultRooms } from "./controllers/room.controller.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

const PORT = ENV.PORT || 3000;

// Required for secure cookies behind a reverse proxy (Render, Railway, etc.)
app.set("trust proxy", 1);

// Add security headers (helmet) and high-efficiency GZIP compression for API performance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  compression({
    level: 6,
    threshold: 512, // Compress any response payload over 512 bytes
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Lightweight Request Logger for production observability
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== "/api/health") {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    }
  });
  next();
});

// Build a deduplicated list of allowed origins
const allowedOrigins = [
  ...new Set(["http://localhost:5173", ENV.CLIENT_URL].filter(Boolean)),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check allowed origins: exact matches, vercel preview/prod apps, onrender domains, and local dev ports
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow all other web origins with credentials
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Root API status endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "ChatIn Real-Time API Server is running!",
    status: "online",
    endpoints: {
      auth: "/api/auth",
      messages: "/api/messages",
      rooms: "/api/rooms",
      health: "/api/health",
    },
    clientURL: ENV.CLIENT_URL || "http://localhost:5173",
  });
});

// Enhanced Health check endpoint for Uptime monitoring (Render / Railway / UptimeRobot)
app.get("/api/health", (_req, res) => {
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const dbStatus = dbStatusMap[mongoose.connection.readyState] || "unknown";

  res.status(200).json({
    status: "healthy",
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1,
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

// --- API Route Mounting ---
// Auth routes: authLimiter is already applied per-route in auth.route.js (10 attempts/15min)
// Messages & Rooms: general apiLimiter provides 150 req/15min baseline protection
app.use("/api/auth", authRoutes);
app.use("/api/messages", apiLimiter, messageRoutes);
app.use("/api/rooms", apiLimiter, roomRoutes);

// Catch-all 404 handler for unknown /api routes (returns JSON, not HTML)
app.all("/api/*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler (handles JSON syntax errors, Mongoose, payload size, unhandled exceptions)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);

  if (res.headersSent) return;

  // Handle Payload Too Large
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({ message: "Payload too large. Maximum upload size is 5MB." });
  }

  // Handle Bad JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON format in request body." });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

server.listen(PORT, async () => {
  console.log("Server running on port:", PORT);
  await connectDB();
  await seedDefaultRooms();
});

// Graceful shutdown handling for zero-downtime production restarts (Render / Railway / Docker)
const handleShutdown = async (signal) => {
  console.log(`[SERVER] ${signal} signal received: closing HTTP server and database connection`);
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log("[SERVER] HTTP server closed, database connection gracefully closed");
      process.exit(0);
    } catch (err) {
      console.error("[SERVER] Error during shutdown:", err.message);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[SERVER] Unhandled Promise Rejection:", reason);
});

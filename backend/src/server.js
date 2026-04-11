import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const PORT = ENV.PORT || 3000;

// Required for secure cookies behind a reverse proxy (Render, Railway, etc.)
app.set("trust proxy", 1);

// Add security headers (helmet) and GZIP compression for API performance
// We set crossOriginResourcePolicy to "cross-origin" specifically so that our front-end
// deployed on a different domain can still communicate with our API.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Build a deduplicated list of allowed origins
const allowedOrigins = [
  ...new Set(
    ["http://localhost:5173", ENV.CLIENT_URL].filter(Boolean)
  ),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin header) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Global error handler (catches any unhandled errors thrown by route handlers)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

server.listen(PORT, () => {
  console.log("Server running on port:", PORT);
  connectDB();
});

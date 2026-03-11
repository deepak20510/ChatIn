import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const PORT = ENV.PORT || 3000;

// IMPORTANT for Render (secure cookies behind proxy)
app.set("trust proxy", 1);

// Simple CORS setup
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Simplified CORS for production
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chatin-plum.vercel.app",
      ENV.CLIENT_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log("Server running on port:", PORT);
  connectDB();
});

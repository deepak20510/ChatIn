import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" }));

// CORS configuration for production and development
const corsOrigins = [
  "http://localhost:5173", // dev frontend
];

// Add production URLs
if (ENV.CLIENT_URL) {
  corsOrigins.push(ENV.CLIENT_URL);
}

// Add Vercel deployment domains
corsOrigins.push(/\.vercel\.app$/);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});

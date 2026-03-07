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
const allowedOrigins = [
  "http://localhost:5173", // dev frontend
];

if (ENV.CLIENT_URL) {
  allowedOrigins.push(ENV.CLIENT_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS request from origin:", origin); // debug log

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check regex for Vercel deployments (.vercel.app)
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    console.log("CORS origin rejected:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(cookieParser());

// Trust proxy to ensure secure cookies work behind reverse proxy
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});

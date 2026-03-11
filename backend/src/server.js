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

// Enhanced security headers to fix Permissions Policy errors
app.use((req, res, next) => {
  // Fix Permissions Policy warnings
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(), ' +
    'sync-xhr=(), encrypted-media=(), picture-in-picture=(), ' +
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), ' +
    'battery=(), display-capture=(), document-domain=(), ' +
    'execution-while-not-rendered=(), execution-while-out-of-viewport=(), ' +
    'gamepad=(), hid=(), idle-detection=(), local-fonts=(), ' +
    'midi=(), navigation-override=(), otp-credentials=(), ' +
    'publickey-credentials-get=(), screen-wake-lock=(), serial=(), ' +
    'web-share=(), xr-spatial-tracking=()'
  );
  
  // Additional CORS headers for better cross-domain support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  
  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Allowed frontend origins - more permissive for debugging
const allowedOrigins = [
  "http://localhost:5173", 
  "https://localhost:5173",
  ENV.CLIENT_URL,
  "https://chatin-plum.vercel.app",
  "https://chatin-uqkb.onrender.com"
].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("CORS check for origin:", origin);
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        console.log("No origin - allowing");
        return callback(null, true);
      }

      // Check if origin is in allowed list or is a vercel.app domain
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        console.log("Origin allowed:", origin);
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log("Server running on port:", PORT);
  connectDB();
});

import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "../lib/env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// Allowed origins for Socket.io
const allowedOrigins = ["http://localhost:5173", ENV.CLIENT_URL].filter(
  Boolean,
); // Remove undefined values

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow no origin (like mobile apps)
      if (!origin) return callback(null, true);

      // Check exact matches
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check Vercel domains
      if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// { userId (string) : socketId }
const userSocketMap = {};

// helper
export function getReceiverSocketId(userId) {
  return userSocketMap[userId.toString()];
}

// auth middleware
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  const userId = socket.userId; // ✅ already string

  console.log("A user connected:", socket.user.fullName);

  userSocketMap[userId] = socket.id;

  // send online users as STRING IDs
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.user.fullName);

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };

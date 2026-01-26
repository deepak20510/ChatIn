import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "../lib/env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
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

import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "../lib/env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

// Allowed origins for Socket.io
const allowedOrigins = ["http://localhost:5173", ENV.CLIENT_URL].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6,
  transports: ["websocket", "polling"],
});

// Multi-device Socket Registry: userId -> Set<socketId>
// Supporting 100+ concurrent users with multiple tabs/devices per user seamlessly
const userSocketsMap = new Map();

/**
 * Get all active socket IDs for a given user
 */
export function getUserSocketIds(userId) {
  if (!userId) return [];
  const set = userSocketsMap.get(userId.toString());
  return set ? Array.from(set) : [];
}

/**
 * Legacy compatibility helper: returns the primary socket ID for a user
 */
export function getReceiverSocketId(userId) {
  const ids = getUserSocketIds(userId);
  return ids.length > 0 ? ids[0] : undefined;
}

/**
 * Emit an event to all connected sockets of a specific user
 */
export function emitToUser(userId, event, payload) {
  const socketIds = getUserSocketIds(userId);
  for (const socketId of socketIds) {
    io.to(socketId).emit(event, payload);
  }
}

/**
 * Emit an event to a room
 */
export function emitToRoom(roomId, event, payload) {
  if (!roomId) return;
  io.to(roomId.toString()).emit(event, payload);
}

// Socket authentication middleware (JWT verified)
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  const userId = socket.userId;
  const user = socket.user;

  if (!userId) {
    return socket.disconnect();
  }

  // Register socket for this user
  if (!userSocketsMap.has(userId)) {
    userSocketsMap.set(userId, new Set());
  }
  userSocketsMap.get(userId).add(socket.id);

  console.log(`[SOCKET] User connected: ${user.fullName} (${userId}) | Active sockets: ${userSocketsMap.get(userId).size}`);

  // Broadcast the list of distinct online user IDs
  io.emit("getOnlineUsers", Array.from(userSocketsMap.keys()));

  // 1. Join Room Handler
  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(roomId.toString());
    console.log(`[SOCKET] ${user.fullName} joined room: ${roomId}`);
  });

  // 2. Leave Room Handler
  socket.on("leaveRoom", (roomId) => {
    if (!roomId) return;
    socket.leave(roomId.toString());
    console.log(`[SOCKET] ${user.fullName} left room: ${roomId}`);
  });

  // 3. Private Chat Typing Indicators
  socket.on("typing", ({ receiverId }) => {
    if (!receiverId) return;
    emitToUser(receiverId, "userTyping", {
      senderId: userId,
      senderName: user.fullName,
    });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    if (!receiverId) return;
    emitToUser(receiverId, "userStoppedTyping", {
      senderId: userId,
    });
  });

  // 4. Room Typing Indicators
  socket.on("roomTyping", ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId.toString()).emit("roomUserTyping", {
      roomId: roomId.toString(),
      senderId: userId,
      senderName: user.fullName,
    });
  });

  socket.on("roomStopTyping", ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId.toString()).emit("roomUserStoppedTyping", {
      roomId: roomId.toString(),
      senderId: userId,
    });
  });

  // 5. Read Receipts & Message Status
  socket.on("markMessagesRead", async ({ senderId }) => {
    try {
      if (!senderId) return;
      await Message.updateMany(
        { senderId, receiverId: userId, isRead: false },
        { $set: { isRead: true } }
      );
      // Notify sender that their messages have been read
      emitToUser(senderId, "messagesRead", {
        readBy: userId,
      });
      // Also notify reader's other tabs
      emitToUser(userId, "messagesRead", {
        readBy: userId,
      });
    } catch (err) {
      console.error("[SOCKET] Error marking messages read:", err.message);
    }
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    if (userSocketsMap.has(userId)) {
      const socketSet = userSocketsMap.get(userId);
      socketSet.delete(socket.id);

      if (socketSet.size === 0) {
        userSocketsMap.delete(userId);
        console.log(`[SOCKET] User fully disconnected: ${user.fullName} (${userId})`);
      } else {
        console.log(`[SOCKET] Socket closed for ${user.fullName} | Remaining sockets: ${socketSet.size}`);
      }
    }

    // Broadcast updated distinct online user IDs
    io.emit("getOnlineUsers", Array.from(userSocketsMap.keys()));
  });
});

export { io, app, server };

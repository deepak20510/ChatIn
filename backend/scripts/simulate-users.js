/**
 * ChatIn Simultaneous User Load Test (Req #19)
 * -----------------------------------------------
 * Simulates N concurrent Socket.IO users connecting, joining rooms,
 * and exchanging messages. Tests server stability under load.
 *
 * Usage:
 *   node backend/scripts/simulate-users.js [numUsers] [durationSec]
 * Example:
 *   node backend/scripts/simulate-users.js 50 30
 */

import { io } from "socket.io-client";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import "dotenv/config";

const NUM_USERS = parseInt(process.argv[2] || "20", 10);
const DURATION_SEC = parseInt(process.argv[3] || "15", 10);
const SERVER_URL = process.env.SOCKET_TEST_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET not set in environment. Cannot generate test tokens.");
  process.exit(1);
}

console.log(`\n🚀 Starting load test: ${NUM_USERS} concurrent users for ${DURATION_SEC}s on ${SERVER_URL}\n`);

const stats = {
  connected: 0,
  failed: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0,
};

const sockets = [];

for (let i = 0; i < NUM_USERS; i++) {
  const fakeUserId = new mongoose.Types.ObjectId().toString();
  const token = jwt.sign({ userId: fakeUserId }, JWT_SECRET, { expiresIn: "1h" });

  const socket = io(SERVER_URL, {
    auth: { token },
    transports: ["websocket"],
    timeout: 10000,
    reconnection: false, // For load testing, no reconnects
  });

  socket.on("connect", () => {
    stats.connected++;
    // Simulate joining a public room
    socket.emit("joinRoom", "000000000000000000000001");

    // Send a message every 2 seconds (simulating active users)
    const interval = setInterval(() => {
      socket.emit("ping");
      stats.messagesSent++;
    }, 2000);

    socket._loadTestInterval = interval;
  });

  socket.on("getOnlineUsers", (users) => {
    stats.messagesReceived++;
  });

  socket.on("connect_error", (err) => {
    stats.failed++;
    stats.errors++;
  });

  socket.on("error", () => {
    stats.errors++;
  });

  sockets.push(socket);
}

// Wait for duration then tear down and print results
setTimeout(() => {
  console.log("\n📊 Load Test Results:");
  console.log(`   🟢 Connected:          ${stats.connected}/${NUM_USERS} users`);
  console.log(`   🔴 Failed to connect:  ${stats.failed}`);
  console.log(`   📤 Pings sent:         ${stats.messagesSent}`);
  console.log(`   📥 Events received:    ${stats.messagesReceived}`);
  console.log(`   ⚠️  Errors:            ${stats.errors}`);

  const successRate = ((stats.connected / NUM_USERS) * 100).toFixed(1);
  console.log(`\n   ✅ Success rate: ${successRate}%`);

  if (stats.failed === 0) {
    console.log("   🎉 All users connected successfully. Server is stable.\n");
  } else {
    console.warn(`   ⚠️  ${stats.failed} users failed to connect. Check server logs.\n`);
  }

  sockets.forEach((s) => {
    if (s._loadTestInterval) clearInterval(s._loadTestInterval);
    s.disconnect();
  });

  process.exit(stats.failed === 0 ? 0 : 1);
}, DURATION_SEC * 1000);

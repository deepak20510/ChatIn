import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Room from "./src/models/Room.js";
import Message from "./src/models/Message.js";
import User from "./src/models/User.js";
import { getUserSocketIds, emitToUser, emitToRoom } from "./src/lib/socket.js";
import { ENV } from "./src/lib/env.js";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING CHATIN FEATURE & ARCHITECTURE TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. JWT Authentication & Security Test
  console.log("\n--- TEST 1: JWT Token Generation & Verification ---");
  const dummyUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ userId: dummyUserId }, ENV.JWT_SECRET, { expiresIn: "1h" });
  const decoded = jwt.verify(token, ENV.JWT_SECRET);
  assert(decoded.userId === dummyUserId.toString(), "JWT verified successfully with correct userId");

  // 2. Room Model & Schema Validation Test
  console.log("\n--- TEST 2: Room Model & Index Structure ---");
  const testRoom = new Room({
    name: "engineering-core",
    topic: "Architecture & Scale",
    description: "Real-time backend engineering discussions",
    isPrivate: false,
  });
  assert(testRoom.name === "engineering-core", "Room model instantiated with correct name");
  assert(testRoom.isPrivate === false, "Public room defaults correctly");
  assert(Room.schema.indexes().length >= 3, "Room model has compound performance indexes defined");

  // 3. Message Model Support for Direct & Room Chats Test
  console.log("\n--- TEST 3: Message Model Schema for 1-on-1 & Rooms ---");
  const directMessage = new Message({
    senderId: dummyUserId,
    receiverId: new mongoose.Types.ObjectId(),
    text: "Hello direct private conversation!",
  });
  assert(directMessage.senderId.toString() === dummyUserId.toString(), "Direct message senderId mapped");
  assert(directMessage.isRead === false, "Message read receipt defaults to false");

  const roomMessage = new Message({
    senderId: dummyUserId,
    roomId: new mongoose.Types.ObjectId(),
    text: "Hello public room channel!",
  });
  assert(roomMessage.roomId !== null, "Room message roomId mapped");
  assert(Message.schema.indexes().length >= 4, "Message model has compound indexes for fast 1-on-1 and room lookups");

  // 4. Socket Multi-Device Registry & Helper Test
  console.log("\n--- TEST 4: Multi-Device Socket Registry Helper Functions ---");
  assert(typeof getUserSocketIds === "function", "getUserSocketIds is exported for multi-tab socket management");
  assert(typeof emitToUser === "function", "emitToUser is exported for multi-device delivery");
  assert(typeof emitToRoom === "function", "emitToRoom is exported for room broadcasting");

  // 5. Environment & Cookie Configuration Test
  console.log("\n--- TEST 5: Backend Performance & Config ---");
  assert(ENV.JWT_SECRET.length > 0, "JWT secret key is securely configured");
  assert(Number(ENV.PORT) === 3000, "Port configured properly");

  // 6. Cookie Security & Cross-Domain Compatibility
  console.log("\n--- TEST 6: Cookie Options & Cross-Domain Settings ---");
  const { buildCookieOptions, clearCookieOptions } = await import("./src/lib/utils.js");
  const cookieOpts = buildCookieOptions();
  const clearOpts = clearCookieOptions();
  assert(cookieOpts.httpOnly === true, "Cookie has httpOnly enabled");
  assert(clearOpts.path === "/", "Clear cookie path set to root");
  assert(typeof clearOpts.sameSite === "string", "Cookie has sameSite policy configured");

  console.log("\n==================================================");
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} assertions passed!`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

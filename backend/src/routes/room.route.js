import express from "express";
import {
  getAllRooms,
  createRoom,
  getRoomMessages,
  sendRoomMessage,
  joinRoom,
  leaveRoom,
} from "../controllers/room.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { messageLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

// Apply rate limiting and JWT auth middleware to all room routes
router.use(arcjetProtection, protectRoute);

router.get("/", getAllRooms);
router.post("/", createRoom);
router.get("/:roomId/messages", getRoomMessages);
router.post("/:roomId/send", messageLimiter, sendRoomMessage);
router.post("/:roomId/join", joinRoom);
router.post("/:roomId/leave", leaveRoom);

export default router;

import Room from "../models/Room.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import mongoose from "mongoose";

// Simple in-memory TTL cache for rooms list (15 second TTL)
// Prevents DB thrashing on high traffic — cache is invalidated on any write
const roomsCache = { data: null, ts: 0, TTL: 15_000 };

function invalidateRoomsCache() {
  roomsCache.data = null;
  roomsCache.ts = 0;
}

/**
 * Get all available public rooms and private rooms the user belongs to
 */
export const getAllRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = Date.now();

    // Return cached result if fresh (skips DB query entirely)
    if (roomsCache.data && now - roomsCache.ts < roomsCache.TTL) {
      // Re-apply per-user isMember flag on cached data
      const formatted = roomsCache.data.map((room) => ({
        ...room,
        isMember: room.members
          ? room.members.some((m) => m.toString() === userId.toString())
          : false,
      }));
      return res.status(200).json(formatted);
    }

    // Fetch public rooms OR private rooms where user is in members list
    const rooms = await Room.find({
      $or: [{ isPrivate: false }, { members: userId }],
    })
      .select("name topic description isPrivate creatorId members avatar createdAt")
      .populate("creatorId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .lean();

    // Map to include member count for fast UI rendering
    const formattedRooms = rooms.map((room) => ({
      ...room,
      memberCount: room.members ? room.members.length : 0,
      isMember: room.members ? room.members.some((m) => m.toString() === userId.toString()) : false,
    }));

    // Cache the formatted rooms (including memberCount)
    roomsCache.data = formattedRooms;
    roomsCache.ts = now;

    res.status(200).json(formattedRooms);
  } catch (error) {
    console.error("Error in getAllRooms:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create a new public or private room
 */
export const createRoom = async (req, res) => {
  try {
    const { name, topic, description, isPrivate } = req.body;
    const userId = req.user._id;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Room name must be at least 2 characters" });
    }

    const trimmedName = name.trim();
    const existingRoom = await Room.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    }).lean();

    if (existingRoom) {
      return res.status(400).json({ message: "A room with this name already exists" });
    }

    const newRoom = new Room({
      name: trimmedName,
      topic: topic?.trim() || "General Discussion",
      description: description?.trim() || "",
      isPrivate: Boolean(isPrivate),
      creatorId: userId,
      members: [userId],
    });

    await newRoom.save();

    invalidateRoomsCache();

    const populatedRoom = await Room.findById(newRoom._id)
      .populate("creatorId", "fullName profilePic")
      .lean();

    // Broadcast new room creation to all connected users
    io.emit("roomCreated", {
      ...populatedRoom,
      memberCount: 1,
      isMember: false,
    });

    res.status(201).json({
      ...populatedRoom,
      memberCount: 1,
      isMember: true,
    });
  } catch (error) {
    console.error("Error in createRoom:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get messages for a specific room with pagination support
 */
export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId).lean();
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // If private, ensure user is a member
    if (room.isPrivate && !room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Access denied to private room" });
    }

    const query = { roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("senderId", "fullName profilePic email")
      .lean();

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error in getRoomMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Send a message to a public or private room
 */
export const sendRoomMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required" });
    }

    if (text && text.length > 2000) {
      return res.status(400).json({ message: "Message text cannot exceed 2000 characters" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Auto-join member if public room
    if (!room.members.some((m) => m.toString() === senderId.toString())) {
      if (room.isPrivate) {
        return res.status(403).json({ message: "Not authorized to post in this private room" });
      }
      room.members.push(senderId);
      await room.save();
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "image",
        folder: "chatin_room_messages",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      roomId,
      text: text?.trim(),
      image: imageUrl,
      readBy: [senderId],
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic email")
      .lean();

    // Real-time broadcast to all users in the Socket.IO room
    io.to(roomId.toString()).emit("newRoomMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendRoomMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Join a room
 */
export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.isPrivate && room.creatorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Cannot self-join private room" });
    }

    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
      invalidateRoomsCache();
    }

    res.status(200).json({ message: "Joined room successfully", roomId });
  } catch (error) {
    console.error("Error in joinRoom:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Leave a room
 */
export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.members = room.members.filter((m) => m.toString() !== userId.toString());
    await room.save();
    invalidateRoomsCache();

    res.status(200).json({ message: "Left room successfully", roomId });
  } catch (error) {
    console.error("Error in leaveRoom:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Seed initial default public rooms if database has none
 */
export const seedDefaultRooms = async () => {
  try {
    const count = await Room.countDocuments();
    if (count === 0) {
      const defaultRooms = [
        {
          name: "general",
          topic: "General Community Chat",
          description: "Welcome to ChatIn! Discuss anything and everything with the community.",
          isPrivate: false,
        },
        {
          name: "tech-talk",
          topic: "Web Dev, Cloud & AI",
          description: "Share coding discoveries, tech news, architecture, and developer tips.",
          isPrivate: false,
        },
        {
          name: "announcements",
          topic: "Platform Updates & Releases",
          description: "Official ChatIn updates, new feature spotlights, and community news.",
          isPrivate: false,
        },
        {
          name: "random",
          topic: "Fun, Memes & Chill",
          description: "Relax, share fun memes, hobbies, and casual discussions.",
          isPrivate: false,
        },
      ];

      await Room.insertMany(defaultRooms);
      console.log("[SEED] Initial default public rooms seeded successfully.");
    }
  } catch (err) {
    console.error("[SEED] Error seeding default rooms:", err.message);
  }
};

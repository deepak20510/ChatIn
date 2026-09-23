import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { emitToUser } from "../lib/socket.js";
import mongoose from "mongoose";

/**
 * Get all registered contacts (excluding current user) with lean execution
 */
export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    })
      .select("fullName email profilePic createdAt")
      .sort({ fullName: 1 })
      .lean();

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getAllContacts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get messages between two users with pagination and lean query execution
 */
export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const { limit = 50, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const partnerObjectId = new mongoose.Types.ObjectId(userToChatId);

    const query = {
      $or: [
        { senderId: myId, receiverId: partnerObjectId },
        { senderId: partnerObjectId, receiverId: myId },
      ],
      roomId: null, // Direct 1-on-1 private messages only
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    // Fetch the most recent messages up to parsedLimit
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    // Mark any unread messages from this partner to me as read
    await Message.updateMany(
      { senderId: partnerObjectId, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );
    emitToUser(userToChatId, "messagesRead", { readBy: myId });

    // Reverse so the client receives messages in chronological order [oldest ... newest]
    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error in getMessagesByUserId:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Send a 1-on-1 private message with multi-device real-time delivery
 */
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    if (text && text.length > 2000) {
      return res.status(400).json({ message: "Message text cannot exceed 2000 characters." });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    if (senderId.toString() === receiverId) {
      return res
        .status(400)
        .json({ message: "Cannot send messages to yourself." });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "image",
        folder: "chatin_messages",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text?.trim(),
      image: imageUrl,
      isRead: false,
    });

    await newMessage.save();

    const plainMessage = newMessage.toObject();

    // Multi-device Socket.IO Real-time Delivery
    // Emits to all active devices/tabs of the receiver
    emitToUser(receiverId, "newMessage", plainMessage);

    // Also notify other tabs of the sender
    emitToUser(senderId, "messageSentSync", plainMessage);

    res.status(201).json(plainMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Optimized Aggregation Pipeline to retrieve chat partners sorted by recent activity
 * Reduces memory usage and boosts response time by performing grouping in MongoDB engine
 */
export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const chatPartners = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
          roomId: null, // 1-on-1 private conversations
        },
      },
      {
        $project: {
          partnerId: {
            $cond: {
              if: { $eq: ["$senderId", loggedInUserId] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$partnerId",
          lastMessageAt: { $first: "$createdAt" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partnerDetails",
        },
      },
      { $unwind: "$partnerDetails" },
      {
        $project: {
          _id: "$partnerDetails._id",
          fullName: "$partnerDetails.fullName",
          email: "$partnerDetails.email",
          profilePic: "$partnerDetails.profilePic",
          lastMessageAt: 1,
        },
      },
    ]);

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

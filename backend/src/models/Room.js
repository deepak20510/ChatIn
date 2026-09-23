import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [2, "Room name must be at least 2 characters"],
      maxlength: [50, "Room name cannot exceed 50 characters"],
    },
    topic: {
      type: String,
      trim: true,
      maxlength: [100, "Topic cannot exceed 100 characters"],
      default: "General Discussion",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Performance Indexes for fast room lookups and listing
roomSchema.index({ isPrivate: 1, createdAt: -1 });
roomSchema.index({ name: 1 });
roomSchema.index({ members: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;

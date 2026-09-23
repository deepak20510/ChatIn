import mongoose from "mongoose";
import { ENV } from "./env.js";

let isConnecting = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return true;
  if (isConnecting) return false;
  isConnecting = true;

  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set");

    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 30000,
    });

    console.log("MongoDB connected:", conn.connection.host);
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    return false;
  } finally {
    isConnecting = false;
  }
};

// Mongoose connection event listeners for visibility
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected — attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected successfully");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

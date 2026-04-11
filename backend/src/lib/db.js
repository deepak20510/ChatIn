import mongoose from "mongoose";
import { ENV } from "./env.js";

let isConnecting = false;

export const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set");

    const conn = await mongoose.connect(MONGO_URI, {
      // Mongoose 8 has built-in retry logic — these options make it robust
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Do NOT process.exit — let the process stay alive so Render/Railway
    // can retry. Mongoose will automatically attempt to reconnect.
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

import { create } from "zustand";
import { axiosInstance, setLogoutCallback } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      if (res.data && res.data._id) {
        set({ authUser: res.data });
        if (res.data.token) localStorage.setItem("chat-token", res.data.token);
        get().connectSocket();
      } else {
        localStorage.removeItem("chat-token");
        set({ authUser: null });
      }
    } catch {
      localStorage.removeItem("chat-token");
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      if (res.data.token) localStorage.setItem("chat-token", res.data.token);
      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Signup failed";
      toast.error(errorMsg);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      if (res.data.token) localStorage.setItem("chat-token", res.data.token);
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      const errorMsg =
        error.userMessage ||
        error.response?.data?.message ||
        "Login failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // Even if the server request fails, force logout on the client side
    } finally {
      localStorage.removeItem("chat-token");
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");
    }
  },

  updateProfile: async (data) => {
    const { authUser } = get();
    if (!authUser) {
      toast.error("Please login to update profile");
      return;
    }

    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Profile update failed";
      toast.error(errorMsg);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const token = localStorage.getItem("chat-token") || authUser.token;

    const socket = io(SOCKET_URL, {
      auth: { token }, // Pass token directly from state
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("connect_error", (error) => {
      console.warn("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
      // Update online users to empty since we lost the socket
      if (reason === "io server disconnect") {
        // Server forced disconnect (e.g. invalid token) — don't auto-reconnect
        set({ onlineUsers: [] });
      }
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

// Register the logout callback with axios so 401 responses auto-logout the user.
// Done here (not inside the store) to avoid circular dep / dynamic import issues.
setLogoutCallback(() => {
  const { authUser, logout } = useAuthStore.getState();
  if (authUser) logout();
});

import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Token refresh interval in milliseconds (checks every 5 seconds)
const TOKEN_CHECK_INTERVAL = 5 * 1000;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],
  tokenRefreshInterval: null,

  // Safely decode JWT payload
  decodeJWT: (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error("JWT decode error:", error);
      return null;
    }
  },

  // Initialize token refresh monitoring
  initTokenRefresh: () => {
    // Clear any existing interval
    const existingInterval = get().tokenRefreshInterval;
    if (existingInterval) clearInterval(existingInterval);

    const interval = setInterval(async () => {
      try {
        const { authUser, decodeJWT, refreshToken } = get();
        if (!authUser) return;

        // Get the JWT token from cookies
        const jwtCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("jwt="));

        if (!jwtCookie) return;

        // Extract token value and decode
        const token = jwtCookie.split("=")[1];
        const payload = decodeJWT(token);

        if (!payload || !payload.exp) return;

        const expiresIn = (payload.exp * 1000 - Date.now()) / 1000;

        // Refresh if expiring soon (fewer than 30 seconds left)
        if (expiresIn < 30) {
          console.log(
            `⏰ Token expiring in ${Math.ceil(expiresIn)}s - refreshing...`,
          );
          await refreshToken();
        }
      } catch (error) {
        // Silently fail and continue - don't crash the app
        console.debug("Token check error:", error.message);
      }
    }, TOKEN_CHECK_INTERVAL);

    set({ tokenRefreshInterval: interval });
  },

  // Manual token refresh
  refreshToken: async () => {
    try {
      const res = await axiosInstance.post("/auth/refresh");
      console.log("✅ Token refreshed successfully");
      return res.data;
    } catch (error) {
      console.error("❌ Token refresh failed:", error.message);
      // Don't logout here - let the interceptor handle it
      throw error;
    }
  },

  // Cleanup token refresh monitoring
  stopTokenRefresh: () => {
    const interval = get().tokenRefreshInterval;
    if (interval) {
      clearInterval(interval);
      set({ tokenRefreshInterval: null });
    }
  },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
      get().initTokenRefresh();
    } catch (error) {
      console.log("Error in authCheck:", error);
      if (error.response?.status === 401) {
        console.log("Token expired or invalid - user needs to re-login");
      }
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

      toast.success("Account created successfully!");
      get().connectSocket();
      get().initTokenRefresh();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Signup failed";
      toast.error(errorMsg);
      console.error("Signup error:", error);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
      get().initTokenRefresh();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMsg);
      console.error("Login error:", error);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      get().stopTokenRefresh();
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error);
      // Force logout even if request fails
      set({ authUser: null });
      get().stopTokenRefresh();
      get().disconnectSocket();
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Profile update failed";
      console.log("Error in update profile:", error);
      toast.error(errorMsg);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.connect();

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));

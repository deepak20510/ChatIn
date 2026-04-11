import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api",
  withCredentials: true,
  timeout: 15000, 
});

// ─── Response interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  // Success — pass through
  (response) => response,

  // Error — handle globally
  (error) => {
    if (error.response?.status === 401) {
      // Import lazily to avoid circular dependency issues
      // Clear auth and redirect to login on any 401
      import("../store/useAuthStore").then(({ useAuthStore }) => {
        const { authUser, logout } = useAuthStore.getState();
        // Only redirect if the user was actually logged in (avoid redirect loop on /login page)
        if (authUser) {
          logout();
        }
      });
    }

    // Network / timeout errors — make the message user-friendly
    if (!error.response) {
      error.userMessage =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection."
          : "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

import axios from "axios";

// Default to empty string so requests hit the origin directly,
// which enables Vite (local) and Vercel (production) proxies to intercept them.
const apiUrl = import.meta.env.VITE_API_URL === "http://localhost:3000" ? "" : (import.meta.env.VITE_API_URL || "");

export const axiosInstance = axios.create({
  baseURL: apiUrl + "/api",
  withCredentials: true,
  timeout: 15000, // 15 second request timeout
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

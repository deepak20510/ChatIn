import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api",
  withCredentials: true,
  timeout: 15000,
});

// Lazy logout callback — registered by useAuthStore after it initializes.
// This avoids a circular dependency / dynamic import() that causes Vite build warnings.
let _logoutCallback = null;
export function setLogoutCallback(fn) {
  _logoutCallback = fn;
}

// ─── Request interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  // Success — pass through
  (response) => response,

  // Error — handle globally
  (error) => {
    const status = error.response?.status;

    // 401 — Session expired or unauthorized
    if (status === 401 && _logoutCallback) {
      // Only trigger auto-logout if we actually have an active session
      const token = localStorage.getItem("chat-token");
      if (token) {
        _logoutCallback();
      }
    }

    // 429 — Rate limit hit
    if (status === 429) {
      error.userMessage =
        error.response?.data?.message ||
        "You are sending requests too quickly. Please wait a moment.";
    }

    // 413 — Payload too large
    if (status === 413) {
      error.userMessage = "File too large. Please reduce the size and try again.";
    }

    // 503 / 502 — Server/gateway errors
    if (status === 503 || status === 502) {
      error.userMessage = "Server is temporarily unavailable. Please try again shortly.";
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

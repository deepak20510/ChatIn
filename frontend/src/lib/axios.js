import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// Ensure credentials are sent with every request
axiosInstance.defaults.withCredentials = true;

// Response interceptor - simple error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle 401 errors - don't log them as they're expected
    if (error.response?.status === 401) {
      // Just return the error, let components handle it
    }
    return Promise.reject(error);
  },
);

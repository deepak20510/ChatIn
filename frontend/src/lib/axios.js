import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// Ensure credentials are sent with every request
axiosInstance.defaults.withCredentials = true;

// Response interceptor - handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - will be handled by useAuthStore
      console.log("Unauthorized (401): Token may have expired");
    }
    return Promise.reject(error);
  },
);

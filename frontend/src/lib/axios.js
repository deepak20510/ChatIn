import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true, // This is critical for sending cookies
});

// Request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("Request to:", config.url);
    console.log("Base URL:", import.meta.env.VITE_API_URL);
    console.log("Full URL:", config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response from:", response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized - Token might be expired or invalid");
    }
    return Promise.reject(error);
  }
);

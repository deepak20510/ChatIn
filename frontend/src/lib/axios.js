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
    if (error.response?.status === 401) {
      // Just log the 401 error, let the auth store handle it
      console.log("401 Unauthorized - token may be expired");
    }
    return Promise.reject(error);
  },
);

import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// Ensure credentials are sent with every request
axiosInstance.defaults.withCredentials = true;

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auth store will handle the redirect
    }
    return Promise.reject(error);
  },
);

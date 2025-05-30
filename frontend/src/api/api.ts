// frontend/src/api/api.ts

// Import the default axios instance, and use its types directly
import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios"; // Use 'type' for type-only imports

// Define the base URL using Vite's environment variables.
// It's good practice to provide a fallback in case the env var isn't set.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Create an Axios instance with the base URL and default headers.
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically attach the JWT token to outgoing requests.
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token"); // Safely get token
      if (token) {
        // Ensure headers.common exists, though Axios usually handles this
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Could not access localStorage for token:", error);
      // Potentially clear token or handle scenario where localStorage is inaccessible
    }
    return config;
  },
  (error: AxiosError) => {
    // Handle request errors (e.g., network issues)
    console.error("API Request Error:", error.message);
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error(
        "API Response Error:",
        error.response.status,
        error.response.data
      );

      if (error.response.status === 401) {
        console.log("Unauthorized. Redirecting to login...");
        // In a real app, you might dispatch an action or use a router hook
        // to navigate programmatically, instead of direct window.location.
        // For example, if you have access to your router instance:
        // router.navigate('/login');
        // Or if you want a full refresh for token cleanup:
        // window.location.href = '/login';
      }
    } else if (error.request) {
      console.error(
        "API No Response Error: No response received from server.",
        error.request
      );
    } else {
      console.error(
        "API Setup Error: Something went wrong in setting up the request.",
        error.message
      );
    }
    return Promise.reject(error);
  }
);

export default api;

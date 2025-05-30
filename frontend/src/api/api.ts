// frontend/src/api/api.ts

import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// We will export a function to setup interceptors,
// allowing us to inject dependencies like the logout function.
export const setupApiInterceptors = (logoutCallback: () => void) => {
  // Always clear existing interceptors before adding new ones.
  // This ensures that if setupApiInterceptors is called multiple times,
  // we don't end up with duplicate interceptors.
  api.interceptors.request.clear();
  api.interceptors.response.clear();

  // Request Interceptor: Automatically attach the JWT token to outgoing requests.
  api.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn("Could not access localStorage for token:", error);
      }
      return config;
    },
    (error: AxiosError) => {
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
          console.warn("Unauthorized request detected. Logging out...");
          logoutCallback();
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
};

// Export the configured Axios instance
export default api;

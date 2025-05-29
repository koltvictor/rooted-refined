// frontend/src/api/api.js

import axios from "axios";

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: "http://localhost:3001/api", // Your backend API base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add a request interceptor to include the JWT token
// This will automatically attach the token to all authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get token from local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

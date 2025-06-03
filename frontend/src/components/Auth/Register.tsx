// frontend/src/components/Auth/Register.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api.ts";
import { useAuth } from "../../hooks/useAuth";
import type { CSSProperties } from "react";
import axios from "axios"; // <-- Make sure AxiosError is imported
import type { BackendErrorResponse } from "../../types/index.ts"; // <-- Ensure this is imported

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      // Assuming response.data contains token and user, similar to login
      login(response.data.token, response.data.user); // Log in the user
      setMessage("Registration successful!");
      navigate("/recipes"); // Redirect to recipes page
    } catch (error: unknown) {
      // <-- Change 'any' to 'unknown' here
      if (axios.isAxiosError<BackendErrorResponse>(error)) {
        // <-- Add type guard
        console.error(
          "Registration failed:",
          error.response?.data || error.message
        );
        setMessage(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } else if (error instanceof Error) {
        // <-- Add general Error handling
        console.error("Registration failed:", error.message);
        setMessage(
          error.message || "An unexpected error occurred during registration."
        );
      } else {
        // <-- Handle truly unknown errors
        console.error("Registration failed: An unknown error occurred", error);
        setMessage(
          `An unknown error occurred during registration: ${String(error)}`
        );
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Register</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>
            Username:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>
          Register
        </button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
      <p style={styles.linkText}>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
  },
  header: {
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
  },
  message: {
    textAlign: "center",
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
    borderRadius: "4px",
  },
  linkText: {
    textAlign: "center",
    marginTop: "20px",
    color: "#666",
  },
};

export default Register;

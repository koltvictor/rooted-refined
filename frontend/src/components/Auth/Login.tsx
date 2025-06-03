// frontend/src/components/Auth/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api.ts";
import axios from "axios";
import type { BackendErrorResponse } from "../../types/index.ts";
import { useAuth } from "../../hooks/useAuth";

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await api.post("/auth/login", { identifier, password });
      login(response.data.token, response.data.user);
      setMessage("Login successful!");
      navigate("/recipes");
    } catch (error: unknown) {
      if (axios.isAxiosError<BackendErrorResponse>(error)) {
        console.error("Login failed:", error.response?.data || error.message);
        setMessage(
          error.response?.data?.message ||
            "Login failed. Please check your credentials."
        );
      } else if (error instanceof Error) {
        console.error("Login failed:", error.message);
        setMessage(
          error.message || "An unexpected error occurred during login."
        );
      } else {
        console.error("Login failed: An unknown error occurred", error);
        setMessage(`An unknown error occurred during login: ${String(error)}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="identifier" style={styles.label}>
            Username or Email:
          </label>
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
          Login
        </button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
      <p style={styles.linkText}>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

import type { CSSProperties } from "react";
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
    boxSizing: "border-box", // Ensures padding doesn't increase total width
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

export default Login;

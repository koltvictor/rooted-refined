// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pool = require("./db");
const authRoutes = require("./routes/authRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const pantryRoutes = require("./routes/pantryRoutes");
const shoppingListRoutes = require("./routes/shoppingListRoutes");
const dataRoutes = require("./routes/dataRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const baseUploadsDir = path.join(__dirname, "uploads");
const profileUploadsDir = path.join(baseUploadsDir, "profiles"); // Specific directory for profile pictures

// Ensure both directories exist
if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
  console.log(`Created directory: ${baseUploadsDir}`);
}
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
  console.log(`Created directory: ${profileUploadsDir}`);
}

app.use("/uploads", express.static(baseUploadsDir)); // Serve files from the base 'uploads' directory

// Basic API route
app.get("/", (req, res) => {
  res.send("Welcome to the Recipe Website Backend!");
});

// Test DB route (keep for now)
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({
      message: "Database connection successful!",
      currentTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("Database query error:", err.stack);
    res
      .status(500)
      .json({ message: "Database query failed", error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/shopping-list", shoppingListRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access backend at: http://localhost:${PORT}`);
});

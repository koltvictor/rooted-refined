// backend/controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile").development); // Initialize Knex
require("dotenv").config({ path: "../.env" }); // Load .env for JWT_SECRET

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env file!");
  process.exit(1); // Exit if secret is missing
}

// User Registration
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await knex("users")
      .where({ email })
      .orWhere({ username })
      .first();
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already in use." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds for salt

    // Insert new user into the database
    const [userId] = await knex("users")
      .insert({
        username,
        email,
        password_hash: hashedPassword,
      })
      .returning(["id", "is_admin"]); // Get the ID of the newly created user

    // Create a JWT token for the new user
    const token = jwt.sign(
      { userId: userId.id, username, email, is_admin: userId.is_admin },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully!",
      user: { id: userId.id, username, email, is_admin: userId.is_admin },
      token,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

// User Login (NEW IMPLEMENTATION)
exports.login = async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' can be username or email

  // Basic validation
  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Username/Email and password are required." });
  }

  try {
    // Find the user by username or email
    const user = await knex("users")
      .where({ username: identifier })
      .orWhere({ email: identifier })
      .first();

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." }); // Use generic message for security
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    console.log("Signing JWT_SECRET:", process.env.JWT_SECRET);
    // If credentials are valid, generate a new JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.status(200).json({
      message: "Login successful!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ message: "Server error during login.", error: error.message });
  }
};

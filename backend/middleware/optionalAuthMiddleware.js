// backend/middleware/optionalAuthMiddleware.js

const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "../.env" }); // Adjust path if your .env is elsewhere

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined for optionalAuthMiddleware!");
  // In production, consider throwing an error here instead of just logging
}

const optionalProtect = (req, res, next) => {
  let token;
  // --- DEBUG LOGS (KEEP THESE IN FOR NOW) ---
  console.log("--- Entering optionalProtect middleware ---");
  console.log("Request URL for optionalProtect:", req.originalUrl);
  // --- END DEBUG LOGS ---

  // Check for token in Authorization header (Bearer Token scheme)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]; // Format: "Bearer TOKEN"

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user ID and other decoded info to the request object
      req.user = decoded;
      // --- DEBUG LOGS (KEEP THESE IN FOR NOW) ---
      console.log("Token found and decoded. req.user set to:", req.user);
      // --- END DEBUG LOGS ---
    } catch (error) {
      // If token is invalid or expired, just log it, but proceed without req.user
      console.warn("Optional token verification failed:", error.message);
      req.user = undefined; // Explicitly set to undefined if verification fails
    }
  } else {
    req.user = undefined; // No token, so no user
    // --- DEBUG LOGS (KEEP THESE IN FOR NOW) ---
    console.log("No Authorization header found for optionalProtect.");
    // --- END DEBUG LOGS ---
  }
  next(); // Always proceed to the next middleware/route handler
};

module.exports = { optionalProtect };

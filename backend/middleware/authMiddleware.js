// backend/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "../.env" }); // Load .env for JWT_SECRET

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env file!");
  process.exit(1); // Exit if secret is missing
}
console.log("Auth Middleware JWT_SECRET:", JWT_SECRET);

const protect = (req, res, next) => {
  let token;

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
      // This makes user info available in subsequent route handlers (e.g., req.user.userId)
      req.user = decoded; // decoded will contain { userId, username, email, iat, exp }
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token." });
  }
};

module.exports = { protect };

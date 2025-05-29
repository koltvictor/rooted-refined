// backend/middleware/adminMiddleware.js

const { protect } = require("./authMiddleware"); // Re-use the protect middleware first

const authorizeAdmin = (req, res, next) => {
  // `req.user` should already be set by the `protect` middleware
  // if this middleware is chained after `protect`.
  if (req.user && req.user.is_admin) {
    next(); // User is authenticated AND is an admin, proceed
  } else {
    res.status(403).json({ message: "Not authorized as an admin." });
  }
};

module.exports = { authorizeAdmin };

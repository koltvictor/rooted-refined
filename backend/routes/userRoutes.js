// backend/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// --- Multer Configuration ---
// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure this path is correct and exists
    // It should match the profileUploadsDir we create in server.js
    cb(null, path.join(__dirname, "../uploads/profiles")); // This path looks correct relative to userRoutes.js
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp and original extension
    cb(null, "profile-" + Date.now() + path.extname(file.originalname));
  },
});

// Filter for image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB file size limit
  },
});
// --- END Multer Configuration ---

// @route GET /api/users/profile
// @desc Get authenticated user's profile
// @access Private
router.get("/profile", protect, userController.getUserProfile);

// @route PUT /api/users/profile
// @desc Update authenticated user's profile
// @access Private
router.put(
  "/profile",
  protect,
  upload.single("profile_picture"),
  userController.updateUserProfile
);

router.put("/profile", protect, userController.updateUserProfile);

router.put("/profile/password", protect, userController.changePassword);

module.exports = router;

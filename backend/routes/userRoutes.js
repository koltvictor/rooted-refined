// backend/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware"); // Assuming your auth middleware export 'protect'

// @route GET /api/users/profile
// @desc Get authenticated user's profile
// @access Private
router.get("/profile", protect, userController.getUserProfile);

// @route PUT /api/users/profile
// @desc Update authenticated user's profile
// @access Private
router.put("/profile", protect, userController.updateUserProfile);

router.put("/profile/password", protect, userController.changePassword);

module.exports = router;

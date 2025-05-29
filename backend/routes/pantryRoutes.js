// backend/routes/pantryRoutes.js

const express = require("express");
const router = express.Router();
const pantryController = require("../controllers/pantryController");
const { protect } = require("../middleware/authMiddleware"); // Import authentication middleware

// All pantry routes are private and require authentication
router.post("/", protect, pantryController.addPantryItem);
router.get("/", protect, pantryController.getPantryItems);
router.put("/:id", protect, pantryController.updatePantryItem);
router.delete("/:id", protect, pantryController.deletePantryItem);

module.exports = router;

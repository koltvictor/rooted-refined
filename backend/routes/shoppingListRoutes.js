// backend/routes/shoppingListRoutes.js

const express = require("express");
const router = express.Router();
const shoppingListController = require("../controllers/shoppingListController");
const { protect } = require("../middleware/authMiddleware"); // Import authentication middleware

// All shopping list routes are private and require authentication
router.post("/", protect, shoppingListController.addShoppingListItem);
router.get("/", protect, shoppingListController.getShoppingListItems);
router.put("/:id", protect, shoppingListController.updateShoppingListItem);
router.delete("/:id", protect, shoppingListController.deleteShoppingListItem);

module.exports = router;

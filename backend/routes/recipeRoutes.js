// backend/routes/recipeRoutes.js

const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeAdmin } = require("../middleware/adminMiddleware");
const { optionalProtect } = require("../middleware/optionalAuthMiddleware");

// Public routes for fetching recipes
router.get("/", recipeController.getRecipes);

// IMPORTANT: Place more specific routes BEFORE general parameter routes
router.get("/my-favorites", protect, recipeController.getMyFavorites);

// Apply optionalProtect to getRecipeById
router.get("/:id", optionalProtect, recipeController.getRecipeById);

// Protected routes (require authentication)
router.post("/", protect, authorizeAdmin, recipeController.createRecipe);
router.put("/:id", protect, recipeController.updateRecipe);
router.delete("/:id", protect, recipeController.deleteRecipe);
router.post("/:id/favorite", protect, recipeController.toggleFavorite);

router.post("/:id/rate", protect, recipeController.submitRecipeRating);

router.post("/:id/comments", protect, recipeController.postComment);

module.exports = router;

// backend/controllers/recipeController.js

const knex = require("knex")(require("../knexfile").development);

// Helper function to check if user is owner or admin
const isOwnerOrAdmin = (req, recipe) => {
  return req.user && (req.user.userId === recipe.user_id || req.user.is_admin);
};

exports.createRecipe = async (req, res) => {
  const {
    title,
    description,
    instructions,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    image_url,
    video_url,
    ingredients,
  } = req.body;
  const user_id = req.user.userId;

  if (!title || !instructions || !ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Title, instructions, and ingredients are required." });
  }

  try {
    await knex.transaction(async (trx) => {
      const [recipeId] = await trx("recipes")
        .insert({
          user_id,
          title,
          description,
          instructions,
          prep_time_minutes,
          cook_time_minutes,
          servings,
          image_url,
          video_url,
        })
        .returning("id");

      const recipeIngredientsToInsert = [];
      for (const item of ingredients) {
        let ingredient = await trx("ingredients")
          .where({ name: item.name.toLowerCase() })
          .first();
        if (!ingredient) {
          [ingredient] = await trx("ingredients")
            .insert({ name: item.name.toLowerCase() })
            .returning("*");
        }

        recipeIngredientsToInsert.push({
          recipe_id: recipeId.id,
          ingredient_id: ingredient.id,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || null,
        });
      }

      if (recipeIngredientsToInsert.length > 0) {
        await trx("recipe_ingredients").insert(recipeIngredientsToInsert);
      }

      res.status(201).json({
        message: "Recipe created successfully!",
        recipeId: recipeId.id,
        title,
        user_id,
      });
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res
      .status(500)
      .json({ message: "Server error creating recipe.", error: error.message });
  }
};

// @desc    Get all recipes
// @route   GET /api/recipes
// @access  Public
exports.getRecipes = async (req, res) => {
  const { search } = req.query; // Get search query parameter

  try {
    // Start building the base query using 'let' so we can modify it
    let query = knex("recipes") // <--- IMPORTANT: Initialize your query builder here
      .select("recipes.*", "users.username")
      .leftJoin("users", "recipes.user_id", "users.id");

    // Apply search filter if 'search' query parameter is present
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(recipes.title) LIKE ?", [searchTerm]) // Search in title
          .orWhereRaw("LOWER(recipes.description) LIKE ?", [searchTerm]); // Search in description
      });
    }

    const recipes = await query.orderBy("created_at", "desc");

    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({
      message: "Server error fetching recipes.",
      error: error.message,
    });
  }
};

// @desc    Get a single recipe by ID with its ingredients
// @route   GET /api/recipes/:id
// @access  Public
exports.getRecipeById = async (req, res) => {
  const { id } = req.params;

  try {
    const recipe = await knex("recipes")
      .select("recipes.*", "users.username")
      .leftJoin("users", "recipes.user_id", "users.id")
      .where("recipes.id", id)
      .first();

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const ingredients = await knex("recipe_ingredients")
      .select(
        "ingredients.name",
        "recipe_ingredients.quantity",
        "recipe_ingredients.unit",
        "recipe_ingredients.notes"
      )
      .join("ingredients", "recipe_ingredients.ingredient_id", "ingredients.id")
      .where("recipe_ingredients.recipe_id", id);

    // Check if the logged-in user has favorited this recipe
    let isFavorited = false;
    if (req.user && req.user.userId) {
      // This condition is key!
      // --- NEW LOGS ---
      console.log(
        "User is authenticated (req.user.userId is present). Checking favorite status..."
      );
      // --- END NEW LOGS ---
      const favorite = await knex("user_favorites")
        .where({ user_id: req.user.userId, recipe_id: id })
        .first();
      isFavorited = !!favorite; // Convert to boolean
      // --- NEW LOGS ---
      console.log("Result of favorite check (isFavorited):", isFavorited);
      // --- END NEW LOGS ---
    } else {
      // --- NEW LOGS ---
      console.log(
        "User is NOT authenticated (req.user.userId is absent). isFavorited will be false."
      );
      // --- END NEW LOGS ---
    }

    // <--- NEW: Fetch average rating and current user's rating
    const ratingStats = await knex("recipe_ratings")
      .where({ recipe_id: id })
      .select(
        knex.raw("AVG(rating) as average_rating"),
        knex.raw("COUNT(rating) as total_ratings")
      )
      .first();

    let currentUserRating = 0;
    if (req.user && req.user.userId) {
      const userRating = await knex("recipe_ratings")
        .where({ user_id: req.user.userId, recipe_id: id })
        .select("rating")
        .first();
      currentUserRating = userRating ? userRating.rating : 0;
    }

    res.status(200).json({
      ...recipe,
      ingredients,
      isFavorited,
      average_rating: parseFloat(ratingStats.average_rating || 0), // Send as float, not string
      total_ratings: parseInt(ratingStats.total_ratings || 0), // Send as integer
      current_user_rating: currentUserRating,
    });
  } catch (error) {
    console.error("Error fetching recipe by ID:", error);
    res
      .status(500)
      .json({ message: "Server error fetching recipe.", error: error.message });
  }
};
exports.submitRecipeRating = async (req, res) => {
  const { id: recipeId } = req.params; // Recipe ID from URL
  const userId = req.user.userId; // User ID from authenticated token
  const { rating } = req.body; // Rating value (1-5) from request body

  // Basic validation for rating
  if (rating === undefined || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ message: "Rating must be an integer between 1 and 5." });
  }

  try {
    // Check if recipe exists
    const recipeExists = await knex("recipes").where({ id: recipeId }).first();
    if (!recipeExists) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    // Check if user has already rated this recipe
    const existingRating = await knex("recipe_ratings")
      .where({ user_id: userId, recipe_id: recipeId })
      .first();

    if (existingRating) {
      // Update existing rating
      await knex("recipe_ratings")
        .where({ user_id: userId, recipe_id: recipeId })
        .update({ rating, updated_at: knex.fn.now() });
      res.status(200).json({ message: "Rating updated successfully." });
    } else {
      // Insert new rating
      await knex("recipe_ratings").insert({
        user_id: userId,
        recipe_id: recipeId,
        rating,
      });
      res.status(201).json({ message: "Rating submitted successfully." });
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({
      message: "Server error submitting rating.",
      error: error.message,
    });
  }
};
// @desc    Update a recipe
// @route   PUT /api/recipes/:id
// @access  Private (requires authentication and ownership OR admin)
exports.updateRecipe = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    instructions,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    image_url,
    video_url,
    ingredients,
  } = req.body;

  if (!title || !instructions || !ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Title, instructions, and ingredients are required." });
  }

  try {
    const existingRecipe = await knex("recipes").where({ id }).first();
    if (!existingRecipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    if (!isOwnerOrAdmin(req, existingRecipe)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this recipe." });
    }

    await knex.transaction(async (trx) => {
      await trx("recipes").where({ id }).update({
        title,
        description,
        instructions,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        image_url,
        video_url,
        updated_at: knex.fn.now(),
      });

      await trx("recipe_ingredients").where({ recipe_id: id }).del();

      const recipeIngredientsToInsert = [];
      for (const item of ingredients) {
        let ingredient = await trx("ingredients")
          .where({ name: item.name.toLowerCase() })
          .first();
        if (!ingredient) {
          [ingredient] = await trx("ingredients")
            .insert({ name: item.name.toLowerCase() })
            .returning("*");
        }
        recipeIngredientsToInsert.push({
          recipe_id: id,
          ingredient_id: ingredient.id,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || null,
        });
      }

      if (recipeIngredientsToInsert.length > 0) {
        await trx("recipe_ingredients").insert(recipeIngredientsToInsert);
      }

      res.status(200).json({ message: "Recipe updated successfully!" });
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res
      .status(500)
      .json({ message: "Server error updating recipe.", error: error.message });
  }
};

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
// @access  Private (requires authentication and ownership OR admin)
exports.deleteRecipe = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.userId;

  try {
    const existingRecipe = await knex("recipes").where({ id }).first();
    if (!existingRecipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    if (!isOwnerOrAdmin(req, existingRecipe)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this recipe." });
    }

    await knex("recipes").where({ id }).del();

    res.status(200).json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res
      .status(500)
      .json({ message: "Server error deleting recipe.", error: error.message });
  }
};

// <--- NEW: Toggle Favorite (Add/Remove)
// @desc    Add or remove a recipe from user favorites
// @route   POST /api/recipes/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  const { id: recipeId } = req.params; // Recipe ID from URL
  const userId = req.user.userId; // User ID from authenticated token

  try {
    // Check if recipe exists
    const recipeExists = await knex("recipes").where({ id: recipeId }).first();
    if (!recipeExists) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    // Check if the recipe is already favorited by the user
    const existingFavorite = await knex("user_favorites")
      .where({ user_id: userId, recipe_id: recipeId })
      .first();

    if (existingFavorite) {
      // If exists, remove it (unfavorite)
      await knex("user_favorites")
        .where({ user_id: userId, recipe_id: recipeId })
        .del();
      res.status(200).json({
        message: "Recipe unfavorited successfully.",
        favorited: false,
      });
    } else {
      // If not exists, add it (favorite)
      await knex("user_favorites").insert({
        user_id: userId,
        recipe_id: recipeId,
      });
      res
        .status(201)
        .json({ message: "Recipe favorited successfully.", favorited: true });
    }
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    res.status(500).json({
      message: "Server error toggling favorite status.",
      error: error.message,
    });
  }
};

// <--- NEW: Get My Favorites
// @desc    Get all favorited recipes for the logged-in user
// @route   GET /api/recipes/my-favorites
// @access  Private
exports.getMyFavorites = async (req, res) => {
  const userId = req.user.userId; // User ID from authenticated token

  try {
    const favoritedRecipes = await knex("user_favorites")
      .select(
        "recipes.id",
        "recipes.title",
        "recipes.description",
        "recipes.image_url",
        "recipes.prep_time_minutes",
        "recipes.cook_time_minutes",
        "recipes.servings",
        "users.username" // Include the username of the recipe creator
      )
      .where("user_favorites.user_id", userId)
      .join("recipes", "user_favorites.recipe_id", "recipes.id")
      .leftJoin("users", "recipes.user_id", "users.id") // Join to get creator's username
      .orderBy("user_favorites.created_at", "desc"); // Order by when they were favorited

    res.status(200).json(favoritedRecipes);
  } catch (error) {
    console.error("Error fetching favorited recipes:", error);
    res.status(500).json({
      message: "Server error fetching favorited recipes.",
      error: error.message,
    });
  }
};

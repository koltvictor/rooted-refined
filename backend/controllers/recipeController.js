// backend/controllers/recipeController.js

const knex = require("knex")(require("../knexfile").development);
const { isOwnerOrAdmin } = require("../utils/authHelpers");
const {
  saveJunctionTableEntries,
  fetchJunctionTableIds,
} = require("../utils/dbHelpers");
const { parseIds } = require("../utils/paramParsers");

/**
 * @desc Create a new recipe
 * @route POST /api/recipes
 * @access Private (requires authentication and admin authorization)
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
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
    categories,
    cuisines,
    seasons,
    dietary_restrictions,
    cooking_methods,
    main_ingredients,
    difficulty_levels,
    occasions,
  } = req.body;
  const user_id = req.user.userId; // User ID from authenticated token

  // Input validation
  if (!title || !instructions || !ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Title, instructions, and ingredients are required." });
  }

  try {
    await knex.transaction(async (trx) => {
      // Insert recipe
      const [newRecipeId] = await trx("recipes")
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

      // Process and insert ingredients
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
          recipe_id: newRecipeId.id,
          ingredient_id: ingredient.id,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || null,
        });
      }

      if (recipeIngredientsToInsert.length > 0) {
        await trx("recipe_ingredients").insert(recipeIngredientsToInsert);
      }

      // Save junction table entries for various filter types
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_categories",
        "category_id",
        categories
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_cuisines",
        "cuisine_id",
        cuisines
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_seasons",
        "season_id",
        seasons
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_dietary_restrictions",
        "dietary_restriction_id",
        dietary_restrictions
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_cooking_methods",
        "cooking_method_id",
        cooking_methods
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_main_ingredients",
        "main_ingredient_id",
        main_ingredients
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_difficulty_levels",
        "difficulty_level_id",
        difficulty_levels
      );
      await saveJunctionTableEntries(
        trx,
        newRecipeId.id,
        "recipe_occasions",
        "occasion_id",
        occasions
      );

      res.status(201).json({
        message: "Recipe created successfully!",
        recipeId: newRecipeId.id,
        title,
        user_id,
      });
    });
  } catch (error) {
    console.error("Error creating recipe:", error.message); // Log specific message
    res
      .status(500)
      .json({ message: "Server error creating recipe.", error: error.message });
  }
};

/**
 * @desc Get all recipes with pagination and filtering
 * @route GET /api/recipes
 * @access Public
 * @param {object} req - The request object (query params: search, categories, cuisines, etc., page, limit).
 * @param {object} res - The response object.
 */

// ... (your existing createRecipe and helper functions) ...

/**
 * @desc Get all recipes with pagination and filtering
 * @route GET /api/recipes
 * @access Public
 * @param {object} req - The request object (query params: search, categories, cuisines, etc., page, limit).
 * @param {object} res - The response object.
 */
exports.getRecipes = async (req, res) => {
  const {
    search,
    categories,
    cuisines,
    seasons,
    dietary_restrictions,
    cooking_methods,
    main_ingredients,
    difficulty_levels,
    occasions,
    page = 1,
    limit = 10, // Default items per page
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    return res
      .status(400)
      .json({ message: "Invalid page or limit parameters." });
  }

  const offset = (pageNum - 1) * limitNum;

  try {
    // Start building the base query for fetching recipes
    let baseQuery = knex("recipes").leftJoin(
      "users",
      "recipes.user_id",
      "users.id"
    );

    // Clone the baseQuery for total count to apply filters without select, limit, or offset
    let countQueryBuilder = baseQuery.clone();

    // Apply search filter if present (to both baseQuery and countQueryBuilder)
    if (search) {
      const searchTerm = `%${String(search).toLowerCase()}%`;
      baseQuery = baseQuery.where((builder) => {
        builder
          .whereRaw("LOWER(recipes.title) LIKE ?", [searchTerm])
          .orWhereRaw("LOWER(recipes.description) LIKE ?", [searchTerm]);
      });
      countQueryBuilder = countQueryBuilder.where((builder) => {
        // Apply to count query too
        builder
          .whereRaw("LOWER(recipes.title) LIKE ?", [searchTerm])
          .orWhereRaw("LOWER(recipes.description) LIKE ?", [searchTerm]);
      });
    }

    // Apply all other filters (to both baseQuery and countQueryBuilder)
    const filterConditions = [
      { param: categories, table: "recipe_categories", column: "category_id" },
      { param: cuisines, table: "recipe_cuisines", column: "cuisine_id" },
      { param: seasons, table: "recipe_seasons", column: "season_id" },
      {
        param: dietary_restrictions,
        table: "recipe_dietary_restrictions",
        column: "dietary_restriction_id",
      },
      {
        param: cooking_methods,
        table: "recipe_cooking_methods",
        column: "cooking_method_id",
      },
      {
        param: main_ingredients,
        table: "recipe_main_ingredients",
        column: "main_ingredient_id",
      },
      {
        param: difficulty_levels,
        table: "recipe_difficulty_levels",
        column: "difficulty_level_id",
      },
      { param: occasions, table: "recipe_occasions", column: "occasion_id" },
    ];

    for (const { param, table, column } of filterConditions) {
      const ids = parseIds(param);
      if (ids.length > 0) {
        // Apply joins and where conditions to both queries
        baseQuery = baseQuery
          .join(table, "recipes.id", `${table}.recipe_id`)
          .whereIn(`${table}.${column}`, ids);
        countQueryBuilder = countQueryBuilder
          .join(table, "recipes.id", `${table}.recipe_id`)
          .whereIn(`${table}.${column}`, ids);
      }
    }

    // --- NEW: Calculate Total Count ---
    // Perform a distinct count of recipe IDs based on the filtered query
    const [totalResult] = await countQueryBuilder.countDistinct(
      "recipes.id as total_count"
    );
    const totalCount = parseInt(totalResult.total_count, 10);
    // --- END NEW ---

    // Finalize the main recipes query with distinct select, order, limit, and offset
    const recipes = await baseQuery
      .distinct("recipes.id") // Ensure distinct recipes
      .select("recipes.*", "users.username") // Select all recipe columns and username
      .orderBy("created_at", "desc")
      .limit(limitNum)
      .offset(offset);

    res.status(200).json({
      recipes,
      currentPage: pageNum,
      perPage: limitNum,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      hasMore: pageNum * limitNum < totalCount,
    });
  } catch (error) {
    console.error("Error fetching recipes:", error.message);
    res.status(500).json({
      message: "Server error fetching recipes.",
      error: error.message,
    });
  }
};
/**
 * @desc Get a single recipe by ID with its ingredients and associated data
 * @route GET /api/recipes/:id
 * @access Public (with optional authentication for favorite/rating status)
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
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
      const favorite = await knex("user_favorites")
        .where({ user_id: req.user.userId, recipe_id: id })
        .first();
      isFavorited = !!favorite;
    }

    // Fetch average rating and current user's rating
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

    // Fetch associated IDs from junction tables
    const categories = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_categories",
      "category_id"
    );
    const cuisines = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_cuisines",
      "cuisine_id"
    );
    const seasons = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_seasons",
      "season_id"
    );
    const dietary_restrictions = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_dietary_restrictions",
      "dietary_restriction_id"
    );
    const cooking_methods = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_cooking_methods",
      "cooking_method_id"
    );
    const main_ingredients = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_main_ingredients",
      "main_ingredient_id"
    );
    const difficulty_levels = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_difficulty_levels",
      "difficulty_level_id"
    );
    const occasions = await fetchJunctionTableIds(
      knex,
      id,
      "recipe_occasions",
      "occasion_id"
    );

    res.status(200).json({
      ...recipe,
      ingredients,
      isFavorited,
      average_rating: parseFloat(ratingStats.average_rating || 0),
      total_ratings: parseInt(ratingStats.total_ratings || 0),
      current_user_rating: currentUserRating,
      categories,
      cuisines,
      seasons,
      dietary_restrictions,
      cooking_methods,
      main_ingredients,
      difficulty_levels,
      occasions,
    });
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error.message);
    res
      .status(500)
      .json({ message: "Server error fetching recipe.", error: error.message });
  }
};

/**
 * @desc Submit or update a recipe rating
 * @route POST /api/recipes/:id/rate
 * @access Private
 * @param {object} req - The request object (params: id, body: { rating }).
 * @param {object} res - The response object.
 */
exports.submitRecipeRating = async (req, res) => {
  const { id: recipeId } = req.params;
  const userId = req.user.userId;
  const { rating } = req.body;

  if (rating === undefined || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ message: "Rating must be an integer between 1 and 5." });
  }

  try {
    const recipeExists = await knex("recipes").where({ id: recipeId }).first();
    if (!recipeExists) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const existingRating = await knex("recipe_ratings")
      .where({ user_id: userId, recipe_id: recipeId })
      .first();

    if (existingRating) {
      await knex("recipe_ratings")
        .where({ user_id: userId, recipe_id: recipeId })
        .update({ rating, updated_at: knex.fn.now() });
      res.status(200).json({ message: "Rating updated successfully." });
    } else {
      await knex("recipe_ratings").insert({
        user_id: userId,
        recipe_id: recipeId,
        rating,
      });
      res.status(201).json({ message: "Rating submitted successfully." });
    }
  } catch (error) {
    console.error("Error submitting rating:", error.message);
    res.status(500).json({
      message: "Server error submitting rating.",
      error: error.message,
    });
  }
};

/**
 * @desc Update an existing recipe
 * @route PUT /api/recipes/:id
 * @access Private (requires authentication and ownership OR admin)
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
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
    categories,
    cuisines,
    seasons,
    dietary_restrictions,
    cooking_methods,
    main_ingredients,
    difficulty_levels,
    occasions,
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

      // Clear existing junction table entries and re-insert new ones
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

      await trx("recipe_categories").where({ recipe_id: id }).del();
      await trx("recipe_cuisines").where({ recipe_id: id }).del();
      await trx("recipe_seasons").where({ recipe_id: id }).del();
      await trx("recipe_dietary_restrictions").where({ recipe_id: id }).del();
      await trx("recipe_cooking_methods").where({ recipe_id: id }).del();
      await trx("recipe_main_ingredients").where({ recipe_id: id }).del();
      await trx("recipe_difficulty_levels").where({ recipe_id: id }).del();
      await trx("recipe_occasions").where({ recipe_id: id }).del();

      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_categories",
        "category_id",
        categories
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_cuisines",
        "cuisine_id",
        cuisines
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_seasons",
        "season_id",
        seasons
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_dietary_restrictions",
        "dietary_restriction_id",
        dietary_restrictions
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_cooking_methods",
        "cooking_method_id",
        cooking_methods
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_main_ingredients",
        "main_ingredient_id",
        main_ingredients
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_difficulty_levels",
        "difficulty_level_id",
        difficulty_levels
      );
      await saveJunctionTableEntries(
        trx,
        id,
        "recipe_occasions",
        "occasion_id",
        occasions
      );

      res.status(200).json({ message: "Recipe updated successfully!" });
    });
  } catch (error) {
    console.error(`Error updating recipe ${id}:`, error.message);
    res
      .status(500)
      .json({ message: "Server error updating recipe.", error: error.message });
  }
};

/**
 * @desc Delete a recipe
 * @route DELETE /api/recipes/:id
 * @access Private (requires authentication and ownership OR admin)
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.deleteRecipe = async (req, res) => {
  const { id } = req.params;

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

    // Note: Database foreign key constraints with ON DELETE CASCADE should handle related entries
    await knex("recipes").where({ id }).del();

    res.status(200).json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error(`Error deleting recipe ${id}:`, error.message);
    res
      .status(500)
      .json({ message: "Server error deleting recipe.", error: error.message });
  }
};

/**
 * @desc Add or remove a recipe from user favorites
 * @route POST /api/recipes/:id/favorite
 * @access Private
 * @param {object} req - The request object (params: id).
 * @param {object} res - The response object.
 */
exports.toggleFavorite = async (req, res) => {
  const { id: recipeId } = req.params;
  const userId = req.user.userId;

  try {
    const recipeExists = await knex("recipes").where({ id: recipeId }).first();
    if (!recipeExists) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const existingFavorite = await knex("user_favorites")
      .where({ user_id: userId, recipe_id: recipeId })
      .first();

    if (existingFavorite) {
      await knex("user_favorites")
        .where({ user_id: userId, recipe_id: recipeId })
        .del();
      res.status(200).json({
        message: "Recipe unfavorited successfully.",
        favorited: false,
      });
    } else {
      await knex("user_favorites").insert({
        user_id: userId,
        recipe_id: recipeId,
      });
      res
        .status(201)
        .json({ message: "Recipe favorited successfully.", favorited: true });
    }
  } catch (error) {
    console.error(
      `Error toggling favorite status for recipe ${recipeId}:`,
      error.message
    );
    res.status(500).json({
      message: "Server error toggling favorite status.",
      error: error.message,
    });
  }
};

/**
 * @desc Get all favorited recipes for the logged-in user
 * @route GET /api/recipes/my-favorites
 * @access Private
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
exports.getMyFavorites = async (req, res) => {
  const userId = req.user.userId;

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
        "users.username"
      )
      .where("user_favorites.user_id", userId)
      .join("recipes", "user_favorites.recipe_id", "recipes.id")
      .leftJoin("users", "recipes.user_id", "users.id")
      .orderBy("user_favorites.created_at", "desc");

    res.status(200).json(favoritedRecipes);
  } catch (error) {
    console.error("Error fetching favorited recipes:", error.message);
    res.status(500).json({
      message: "Server error fetching favorited recipes.",
      error: error.message,
    });
  }
};

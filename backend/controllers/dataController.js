// backend/controllers/dataController.js

const knex = require("knex")(require("../knexfile").development);

// @desc    Get all filter options (categories, cuisines, seasons, etc.)
// @route   GET /api/data/filters
// @access  Public (no authentication needed for simple lists)
exports.getAllFilterOptions = async (req, res) => {
  try {
    const categories = await knex("categories")
      .select("id", "name")
      .orderBy("name");
    const cuisines = await knex("cuisines")
      .select("id", "name")
      .orderBy("name");
    const seasons = await knex("seasons").select("id", "name").orderBy("name");
    const dietaryRestrictions = await knex("dietary_restrictions")
      .select("id", "name")
      .orderBy("name");
    const cookingMethods = await knex("cooking_methods")
      .select("id", "name")
      .orderBy("name");
    const mainIngredients = await knex("main_ingredients")
      .select("id", "name")
      .orderBy("name");
    const difficultyLevels = await knex("difficulty_levels")
      .select("id", "name")
      .orderBy("level_order"); // Order by level_order
    const occasions = await knex("occasions")
      .select("id", "name")
      .orderBy("name");

    res.status(200).json({
      categories,
      cuisines,
      seasons,
      dietaryRestrictions,
      cookingMethods,
      mainIngredients,
      difficultyLevels,
      occasions,
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching filter options.",
        error: error.message,
      });
  }
};

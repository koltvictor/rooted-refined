// backend/controllers/resourceController.js

const knex = require("knex")(require("../knexfile").development);

/**
 * @desc Get all resources, optionally filtered by category
 * @route GET /api/resources
 * @access Public
 * @param {object} req - The request object (query params: category).
 * @param {object} res - The response object.
 */
exports.getAllResources = async (req, res) => {
  const { category } = req.query; // Expects a comma-separated string for multiple categories

  try {
    let query = knex("resources");

    if (category) {
      const categoriesArray = category
        .split(",")
        .map((cat) => cat.trim().toLowerCase());
      query = query.whereIn(knex.raw("LOWER(category)"), categoriesArray);
    }

    const resources = await query.orderBy("title", "asc"); // Order by title for consistency

    res.status(200).json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error.message);
    res.status(500).json({
      message: "Server error fetching resources.",
      error: error.message,
    });
  }
};

// --- Optional: Add functionality to create/update/delete resources (admin-only) ---
// If you want to manage these resources via an admin panel later, you'd add:

// exports.createResource = async (req, res) => { /* ... */ };
// exports.updateResource = async (req, res) => { /* ... */ };
// exports.deleteResource = async (req, res) => { /* ... */ };

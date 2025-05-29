// backend/controllers/pantryController.js

const knex = require("knex")(require("../knexfile").development);

// @desc    Add an ingredient to user's pantry
// @route   POST /api/pantry
// @access  Private
exports.addPantryItem = async (req, res) => {
  const { name, quantity, unit } = req.body;
  const user_id = req.user.userId; // Authenticated user ID

  if (!name || !quantity || !unit) {
    return res
      .status(400)
      .json({ message: "Ingredient name, quantity, and unit are required." });
  }

  try {
    // Ensure the ingredient exists in the master ingredients table
    let ingredient = await knex("ingredients")
      .where({ name: name.toLowerCase() })
      .first(); // Case-insensitive check
    if (!ingredient) {
      // If not, add it
      [ingredient] = await knex("ingredients")
        .insert({ name: name.toLowerCase() })
        .returning("*");
    }

    // Check if the user already has this ingredient in their pantry
    const existingPantryItem = await knex("user_pantries")
      .where({ user_id: user_id, ingredient_id: ingredient.id })
      .first();

    if (existingPantryItem) {
      // If exists, update the quantity (add to it)
      await knex("user_pantries")
        .where({ id: existingPantryItem.id })
        .update({
          quantity: existingPantryItem.quantity + quantity,
          added_at: knex.fn.now(), // Update timestamp
        });
      res
        .status(200)
        .json({ message: "Pantry item quantity updated successfully!" });
    } else {
      // If not exists, insert new pantry item
      const [pantryItemId] = await knex("user_pantries")
        .insert({
          user_id: user_id,
          ingredient_id: ingredient.id,
          quantity,
          unit,
        })
        .returning("id");
      res
        .status(201)
        .json({
          message: "Pantry item added successfully!",
          pantryItemId: pantryItemId.id,
        });
    }
  } catch (error) {
    console.error("Error adding pantry item:", error);
    res
      .status(500)
      .json({
        message: "Server error adding pantry item.",
        error: error.message,
      });
  }
};

// @desc    Get all pantry items for the authenticated user
// @route   GET /api/pantry
// @access  Private
exports.getPantryItems = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const pantryItems = await knex("user_pantries")
      .select(
        "user_pantries.id",
        "ingredients.name",
        "user_pantries.quantity",
        "user_pantries.unit",
        "user_pantries.added_at"
      )
      .join("ingredients", "user_pantries.ingredient_id", "ingredients.id")
      .where({ user_id })
      .orderBy("ingredients.name", "asc"); // Order by ingredient name

    res.status(200).json(pantryItems);
  } catch (error) {
    console.error("Error fetching pantry items:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching pantry items.",
        error: error.message,
      });
  }
};

// @desc    Update a pantry item's quantity or unit
// @route   PUT /api/pantry/:id
// @access  Private (user owns the pantry item)
exports.updatePantryItem = async (req, res) => {
  const { id } = req.params; // pantry item ID
  const { quantity, unit, name } = req.body; // allow name update for unit consistency
  const user_id = req.user.userId;

  if (!quantity || !unit) {
    return res
      .status(400)
      .json({ message: "Quantity and unit are required for update." });
  }

  try {
    // Check if the pantry item exists and belongs to the user
    const pantryItem = await knex("user_pantries").where({ id }).first();
    if (!pantryItem) {
      return res.status(404).json({ message: "Pantry item not found." });
    }
    if (pantryItem.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this pantry item." });
    }

    let updatedIngredientId = pantryItem.ingredient_id;
    if (name) {
      // If user provides a new name, check/create it
      let ingredient = await knex("ingredients")
        .where({ name: name.toLowerCase() })
        .first();
      if (!ingredient) {
        [ingredient] = await knex("ingredients")
          .insert({ name: name.toLowerCase() })
          .returning("*");
      }
      updatedIngredientId = ingredient.id;
    }

    await knex("user_pantries").where({ id }).update({
      ingredient_id: updatedIngredientId,
      quantity,
      unit,
      added_at: knex.fn.now(), // Update timestamp
    });

    res.status(200).json({ message: "Pantry item updated successfully!" });
  } catch (error) {
    console.error("Error updating pantry item:", error);
    res
      .status(500)
      .json({
        message: "Server error updating pantry item.",
        error: error.message,
      });
  }
};

// @desc    Delete a pantry item
// @route   DELETE /api/pantry/:id
// @access  Private (user owns the pantry item)
exports.deletePantryItem = async (req, res) => {
  const { id } = req.params; // pantry item ID
  const user_id = req.user.userId;

  try {
    // Check if the pantry item exists and belongs to the user
    const pantryItem = await knex("user_pantries").where({ id }).first();
    if (!pantryItem) {
      return res.status(404).json({ message: "Pantry item not found." });
    }
    if (pantryItem.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this pantry item." });
    }

    await knex("user_pantries").where({ id }).del();

    res.status(200).json({ message: "Pantry item deleted successfully!" });
  } catch (error) {
    console.error("Error deleting pantry item:", error);
    res
      .status(500)
      .json({
        message: "Server error deleting pantry item.",
        error: error.message,
      });
  }
};

// backend/controllers/shoppingListController.js

const knex = require("knex")(require("../knexfile").development);

// @desc    Add an ingredient to user's shopping list
// @route   POST /api/shopping-list
// @access  Private
exports.addShoppingListItem = async (req, res) => {
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
      .first();
    if (!ingredient) {
      // If not, add it
      [ingredient] = await knex("ingredients")
        .insert({ name: name.toLowerCase() })
        .returning("*");
    }

    // Check if the user already has this ingredient on their shopping list
    const existingShoppingItem = await knex("user_shopping_lists")
      .where({ user_id: user_id, ingredient_id: ingredient.id })
      .first();

    if (existingShoppingItem) {
      // If exists, update the quantity (add to it)
      await knex("user_shopping_lists")
        .where({ id: existingShoppingItem.id })
        .update({
          quantity: existingShoppingItem.quantity + quantity,
          added_at: knex.fn.now(), // Update timestamp
        });
      res
        .status(200)
        .json({ message: "Shopping list item quantity updated successfully!" });
    } else {
      // If not exists, insert new shopping list item
      const [shoppingItemId] = await knex("user_shopping_lists")
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
          message: "Shopping list item added successfully!",
          shoppingItemId: shoppingItemId.id,
        });
    }
  } catch (error) {
    console.error("Error adding shopping list item:", error);
    res
      .status(500)
      .json({
        message: "Server error adding shopping list item.",
        error: error.message,
      });
  }
};

// @desc    Get all shopping list items for the authenticated user
// @route   GET /api/shopping-list
// @access  Private
exports.getShoppingListItems = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const shoppingListItems = await knex("user_shopping_lists")
      .select(
        "user_shopping_lists.id",
        "ingredients.name",
        "user_shopping_lists.quantity",
        "user_shopping_lists.unit",
        "user_shopping_lists.added_at",
        "user_shopping_lists.is_checked"
      )
      .join(
        "ingredients",
        "user_shopping_lists.ingredient_id",
        "ingredients.id"
      )
      .where({ user_id })
      .orderBy("ingredients.name", "asc");

    res.status(200).json(shoppingListItems);
  } catch (error) {
    console.error("Error fetching shopping list items:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching shopping list items.",
        error: error.message,
      });
  }
};

// @desc    Update a shopping list item's quantity, unit, or is_checked status
// @route   PUT /api/shopping-list/:id
// @access  Private (user owns the item)
exports.updateShoppingListItem = async (req, res) => {
  const { id } = req.params; // shopping list item ID
  const { quantity, unit, name, is_checked } = req.body;
  const user_id = req.user.userId;

  // At least one field is required for update. quantity/unit are required if provided.
  if ((quantity && !unit) || (unit && !quantity)) {
    return res
      .status(400)
      .json({
        message: "Quantity and unit must be provided together if updating.",
      });
  }

  try {
    // Check if the shopping list item exists and belongs to the user
    const shoppingItem = await knex("user_shopping_lists")
      .where({ id })
      .first();
    if (!shoppingItem) {
      return res.status(404).json({ message: "Shopping list item not found." });
    }
    if (shoppingItem.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this shopping list item." });
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (is_checked !== undefined) updateData.is_checked = is_checked;
    updateData.added_at = knex.fn.now(); // Update timestamp on any change

    let updatedIngredientId = shoppingItem.ingredient_id;
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
      updateData.ingredient_id = updatedIngredientId;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    await knex("user_shopping_lists").where({ id }).update(updateData);

    res
      .status(200)
      .json({ message: "Shopping list item updated successfully!" });
  } catch (error) {
    console.error("Error updating shopping list item:", error);
    res
      .status(500)
      .json({
        message: "Server error updating shopping list item.",
        error: error.message,
      });
  }
};

// @desc    Delete a shopping list item
// @route   DELETE /api/shopping-list/:id
// @access  Private (user owns the item)
exports.deleteShoppingListItem = async (req, res) => {
  const { id } = req.params; // shopping list item ID
  const user_id = req.user.userId;

  try {
    // Check if the shopping list item exists and belongs to the user
    const shoppingItem = await knex("user_shopping_lists")
      .where({ id })
      .first();
    if (!shoppingItem) {
      return res.status(404).json({ message: "Shopping list item not found." });
    }
    if (shoppingItem.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this shopping list item." });
    }

    await knex("user_shopping_lists").where({ id }).del();

    res
      .status(200)
      .json({ message: "Shopping list item deleted successfully!" });
  } catch (error) {
    console.error("Error deleting shopping list item:", error);
    res
      .status(500)
      .json({
        message: "Server error deleting shopping list item.",
        error: error.message,
      });
  }
};

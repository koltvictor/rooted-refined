// backend/utils/dbHelpers.js

/**
 * Saves entries into a junction table within a transaction.
 * @param {object} trx - The Knex transaction object.
 * @param {number} recipeId - The ID of the recipe.
 * @param {string} table - The name of the junction table (e.g., 'recipe_categories').
 * @param {string} columnId - The name of the column holding the foreign key ID (e.g., 'category_id').
 * @param {Array<number>} itemIds - An array of IDs to insert into the junction table.
 */
const saveJunctionTableEntries = async (
  trx,
  recipeId,
  table,
  columnId,
  itemIds
) => {
  if (!itemIds || itemIds.length === 0) return;
  const entries = itemIds.map((id) => ({
    recipe_id: recipeId,
    [columnId]: id,
  }));
  await trx(table).insert(entries);
};

/**
 * Fetches IDs from a junction table for a given recipe.
 * @param {object} knexInstance - The Knex instance.
 * @param {number} recipeId - The ID of the recipe.
 * @param {string} junctionTable - The name of the junction table (e.g., 'recipe_categories').
 * @param {string} columnId - The name of the column holding the foreign key ID (e.g., 'category_id').
 * @returns {Promise<Array<number>>} A promise that resolves to an array of IDs.
 */
const fetchJunctionTableIds = async (
  knexInstance,
  recipeId,
  junctionTable,
  columnId
) => {
  try {
    const result = await knexInstance(junctionTable)
      .select(columnId)
      .where({ recipe_id: recipeId });
    return result.map((row) => row[columnId]);
  } catch (error) {
    console.error(
      `Error fetching IDs from ${junctionTable} for recipe ${recipeId}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  saveJunctionTableEntries,
  fetchJunctionTableIds,
};

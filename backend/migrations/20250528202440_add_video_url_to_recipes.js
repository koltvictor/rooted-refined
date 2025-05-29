// backend/migrations/YOUR_TIMESTAMP_add_video_url_to_recipes.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.table("recipes", function (table) {
    table.string("video_url", 255); // New column for video URL, can be null
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.table("recipes", function (table) {
    table.dropColumn("video_url");
  });
};

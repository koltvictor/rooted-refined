// backend/migrations/YOUR_TIMESTAMP_create_recipe_ratings_table.js

exports.up = function (knex) {
  return knex.schema.createTable("recipe_ratings", function (table) {
    table.increments("id").primary(); // Unique ID for each rating entry
    table.integer("user_id").unsigned().notNullable();
    table.integer("recipe_id").unsigned().notNullable();
    table.integer("rating").notNullable(); // The star rating (e.g., 1 to 5)
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("recipe_id")
      .references("id")
      .inTable("recipes")
      .onDelete("CASCADE");

    // Ensure a user can only rate a specific recipe once
    table.unique(["user_id", "recipe_id"]);

    // Add a check constraint to ensure rating is between 1 and 5 (optional but good practice)
    table.check("rating >= 1 AND rating <= 5", [], "rating_check");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_ratings");
};

// backend/migrations/20250528214253_create_user_favorites_table.js

exports.up = function (knex) {
  return knex.schema.createTable("user_favorites", function (table) {
    table.integer("user_id").unsigned().notNullable();
    table.integer("recipe_id").unsigned().notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

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

    // Composite primary key to ensure unique user-recipe pairs
    table.primary(["user_id", "recipe_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("user_favorites");
};

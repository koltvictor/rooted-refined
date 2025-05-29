// backend/migrations/YOUR_TIMESTAMP_create_cooking_methods_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("cooking_methods", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Junction table
      return knex.schema.createTable(
        "recipe_cooking_methods",
        function (table) {
          table.integer("recipe_id").unsigned().notNullable();
          table.integer("cooking_method_id").unsigned().notNullable();
          table.primary(["recipe_id", "cooking_method_id"]);
          table
            .foreign("recipe_id")
            .references("id")
            .inTable("recipes")
            .onDelete("CASCADE");
          table
            .foreign("cooking_method_id")
            .references("id")
            .inTable("cooking_methods")
            .onDelete("CASCADE");
        }
      );
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_cooking_methods").then(() => {
    return knex.schema.dropTableIfExists("cooking_methods");
  });
};

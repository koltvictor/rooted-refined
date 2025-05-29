// backend/migrations/YOUR_TIMESTAMP_create_main_ingredients_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("main_ingredients", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Junction table
      return knex.schema.createTable(
        "recipe_main_ingredients",
        function (table) {
          table.integer("recipe_id").unsigned().notNullable();
          table.integer("main_ingredient_id").unsigned().notNullable();
          table.primary(["recipe_id", "main_ingredient_id"]);
          table
            .foreign("recipe_id")
            .references("id")
            .inTable("recipes")
            .onDelete("CASCADE");
          table
            .foreign("main_ingredient_id")
            .references("id")
            .inTable("main_ingredients")
            .onDelete("CASCADE");
        }
      );
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_main_ingredients").then(() => {
    return knex.schema.dropTableIfExists("main_ingredients");
  });
};

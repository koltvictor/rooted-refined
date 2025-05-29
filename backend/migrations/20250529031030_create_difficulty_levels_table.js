// backend/migrations/YOUR_TIMESTAMP_create_difficulty_levels_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("difficulty_levels", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table
        .integer("level_order")
        .unique()
        .comment("e.g., 1 for Easy, 5 for Expert"); // For sorting
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Junction table (though often 1-to-many, we'll keep it consistent with many-to-many if flexibility is desired)
      return knex.schema.createTable(
        "recipe_difficulty_levels",
        function (table) {
          table.integer("recipe_id").unsigned().notNullable();
          table.integer("difficulty_level_id").unsigned().notNullable();
          table.primary(["recipe_id", "difficulty_level_id"]);
          table
            .foreign("recipe_id")
            .references("id")
            .inTable("recipes")
            .onDelete("CASCADE");
          table
            .foreign("difficulty_level_id")
            .references("id")
            .inTable("difficulty_levels")
            .onDelete("CASCADE");
        }
      );
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_difficulty_levels").then(() => {
    return knex.schema.dropTableIfExists("difficulty_levels");
  });
};

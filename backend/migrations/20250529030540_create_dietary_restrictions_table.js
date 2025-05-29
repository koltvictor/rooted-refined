// backend/migrations/YOUR_TIMESTAMP_create_dietary_restrictions_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("dietary_restrictions", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Create the junction table for recipes and dietary restrictions
      return knex.schema.createTable(
        "recipe_dietary_restrictions",
        function (table) {
          table.integer("recipe_id").unsigned().notNullable();
          table.integer("dietary_restriction_id").unsigned().notNullable();
          table.primary(["recipe_id", "dietary_restriction_id"]);
          table
            .foreign("recipe_id")
            .references("id")
            .inTable("recipes")
            .onDelete("CASCADE");
          table
            .foreign("dietary_restriction_id")
            .references("id")
            .inTable("dietary_restrictions")
            .onDelete("CASCADE");
        }
      );
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("recipe_dietary_restrictions")
    .then(() => {
      return knex.schema.dropTableIfExists("dietary_restrictions");
    });
};

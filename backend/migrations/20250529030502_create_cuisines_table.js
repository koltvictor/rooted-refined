// backend/migrations/YOUR_TIMESTAMP_create_cuisines_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("cuisines", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Create the junction table for recipes and cuisines
      return knex.schema.createTable("recipe_cuisines", function (table) {
        table.integer("recipe_id").unsigned().notNullable();
        table.integer("cuisine_id").unsigned().notNullable();
        table.primary(["recipe_id", "cuisine_id"]);
        table
          .foreign("recipe_id")
          .references("id")
          .inTable("recipes")
          .onDelete("CASCADE");
        table
          .foreign("cuisine_id")
          .references("id")
          .inTable("cuisines")
          .onDelete("CASCADE");
      });
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_cuisines").then(() => {
    return knex.schema.dropTableIfExists("cuisines");
  });
};

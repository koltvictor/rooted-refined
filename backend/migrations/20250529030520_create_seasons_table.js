// backend/migrations/YOUR_TIMESTAMP_create_seasons_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("seasons", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Create the junction table for recipes and seasons
      return knex.schema.createTable("recipe_seasons", function (table) {
        table.integer("recipe_id").unsigned().notNullable();
        table.integer("season_id").unsigned().notNullable();
        table.primary(["recipe_id", "season_id"]);
        table
          .foreign("recipe_id")
          .references("id")
          .inTable("recipes")
          .onDelete("CASCADE");
        table
          .foreign("season_id")
          .references("id")
          .inTable("seasons")
          .onDelete("CASCADE");
      });
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_seasons").then(() => {
    return knex.schema.dropTableIfExists("seasons");
  });
};

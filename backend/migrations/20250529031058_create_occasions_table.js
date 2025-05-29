// backend/migrations/YOUR_TIMESTAMP_create_occasions_table.js

exports.up = function (knex) {
  return knex.schema
    .createTable("occasions", function (table) {
      table.increments("id").primary();
      table.string("name").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Junction table
      return knex.schema.createTable("recipe_occasions", function (table) {
        table.integer("recipe_id").unsigned().notNullable();
        table.integer("occasion_id").unsigned().notNullable();
        table.primary(["recipe_id", "occasion_id"]);
        table
          .foreign("recipe_id")
          .references("id")
          .inTable("recipes")
          .onDelete("CASCADE");
        table
          .foreign("occasion_id")
          .references("id")
          .inTable("occasions")
          .onDelete("CASCADE");
      });
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("recipe_occasions").then(() => {
    return knex.schema.dropTableIfExists("occasions");
  });
};

// backend/migrations/YOUR_TIMESTAMP_create_initial_schema.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Create users table
  await knex.schema.createTable("users", function (table) {
    table.increments("id").primary();
    table.string("username", 50).unique().notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("password_hash", 255).notNullable();
    table.timestamps(true, true); // Adds created_at and updated_at columns
  });

  // Create recipes table
  await knex.schema.createTable("recipes", function (table) {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("title", 255).notNullable();
    table.text("description");
    table.text("instructions").notNullable();
    table.integer("prep_time_minutes");
    table.integer("cook_time_minutes");
    table.integer("servings");
    table.string("image_url", 255);
    table.timestamps(true, true); // Adds created_at and updated_at columns
  });

  // Create ingredients table
  await knex.schema.createTable("ingredients", function (table) {
    table.increments("id").primary();
    table.string("name", 255).unique().notNullable();
  });

  // Create recipe_ingredients table
  await knex.schema.createTable("recipe_ingredients", function (table) {
    table
      .integer("recipe_id")
      .unsigned()
      .references("id")
      .inTable("recipes")
      .onDelete("CASCADE");
    table
      .integer("ingredient_id")
      .unsigned()
      .references("id")
      .inTable("ingredients")
      .onDelete("CASCADE");
    table.decimal("quantity", 10, 2).notNullable();
    table.string("unit", 50).notNullable();
    table.string("notes", 255);
    table.primary(["recipe_id", "ingredient_id"]); // Composite primary key
  });

  // Create user_favorites table
  await knex.schema.createTable("user_favorites", function (table) {
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("recipe_id")
      .unsigned()
      .references("id")
      .inTable("recipes")
      .onDelete("CASCADE");
    table.timestamp("favorited_at").defaultTo(knex.fn.now());
    table.primary(["user_id", "recipe_id"]);
  });

  // Create user_pantries table
  await knex.schema.createTable("user_pantries", function (table) {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("ingredient_id")
      .unsigned()
      .references("id")
      .inTable("ingredients")
      .onDelete("CASCADE");
    table.decimal("quantity", 10, 2).notNullable();
    table.string("unit", 50).notNullable();
    table.timestamp("added_at").defaultTo(knex.fn.now());
    table.unique(["user_id", "ingredient_id"]);
  });

  // Create user_shopping_lists table
  await knex.schema.createTable("user_shopping_lists", function (table) {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("ingredient_id")
      .unsigned()
      .references("id")
      .inTable("ingredients")
      .onDelete("CASCADE");
    table.decimal("quantity", 10, 2).notNullable();
    table.string("unit", 50).notNullable();
    table.timestamp("added_at").defaultTo(knex.fn.now());
    table.boolean("is_checked").defaultTo(false);
    table.unique(["user_id", "ingredient_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop tables in reverse order of creation (due to foreign key constraints)
  await knex.schema.dropTableIfExists("user_shopping_lists");
  await knex.schema.dropTableIfExists("user_pantries");
  await knex.schema.dropTableIfExists("user_favorites");
  await knex.schema.dropTableIfExists("recipe_ingredients");
  await knex.schema.dropTableIfExists("ingredients");
  await knex.schema.dropTableIfExists("recipes");
  await knex.schema.dropTableIfExists("users");
};

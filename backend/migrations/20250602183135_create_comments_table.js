// backend/migrations/20250602183135_create_comments_table.js

exports.up = function (knex) {
  return knex.schema.createTable("comments", (table) => {
    table.increments("id").primary(); // Unique ID for the comment
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // Link to the user who posted the comment
    table
      .integer("recipe_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("recipes")
      .onDelete("CASCADE"); // Link to the recipe the comment belongs to
    table.text("text").notNullable(); // The actual comment text
    table
      .integer("parent_comment_id")
      .unsigned()
      .nullable() // Null for top-level comments, ID of parent for replies
      .references("id")
      .inTable("comments")
      .onDelete("CASCADE"); // Self-referencing foreign key for replies
    table.timestamps(true, true); // created_at and updated_at columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("comments");
};

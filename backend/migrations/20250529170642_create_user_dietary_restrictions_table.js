// backend/migrations/YOUR_NEW_TIMESTAMP_create_user_dietary_restrictions_table.js

exports.up = function (knex) {
  return knex.schema.createTable("user_dietary_restrictions", function (table) {
    table.integer("user_id").unsigned().notNullable();
    table.integer("dietary_restriction_id").unsigned().notNullable();

    // Foreign keys
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("dietary_restriction_id")
      .references("id")
      .inTable("dietary_restrictions")
      .onDelete("CASCADE");

    // Composite primary key to prevent duplicate entries
    table.primary(["user_id", "dietary_restriction_id"]);

    table.timestamps(true, true); // created_at and updated_at columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("user_dietary_restrictions");
};

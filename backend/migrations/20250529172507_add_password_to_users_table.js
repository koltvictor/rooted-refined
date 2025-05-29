// backend/migrations/YOUR_TIMESTAMP_add_password_to_users_table.js

exports.up = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    // Adds a 'password' column that stores strings and cannot be null
    // It should also be long enough to store bcrypt hashes (typically 60 chars)
    table.string("password", 255).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.dropColumn("password");
  });
};

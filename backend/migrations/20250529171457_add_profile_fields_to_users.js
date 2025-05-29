// backend/migrations/YOUR_TIMESTAMP_add_profile_fields_to_users.js

exports.up = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.string("first_name").nullable();
    table.string("last_name").nullable();
    table.text("bio").nullable(); // Use text for longer bios
    table.string("profile_picture_url").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.dropColumn("profile_picture_url");
    table.dropColumn("bio");
    table.dropColumn("last_name");
    table.dropColumn("first_name");
  });
};

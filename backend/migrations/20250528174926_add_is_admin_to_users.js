/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.table("users", function (table) {
    // Add is_admin column with default false, cannot be null
    table.boolean("is_admin").defaultTo(false).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.table("users", function (table) {
    table.dropColumn("is_admin");
  });
};

// backend/migrations/YYYYMMDDHHMMSS_create_resources_table.js

exports.up = function (knex) {
  return knex.schema.createTable("resources", (table) => {
    table.increments("id").primary(); // Unique ID for the resource
    table.string("title", 255).notNullable(); // Display title of the resource (e.g., "Minimalist Baker", "YouTube Channel: Pick Up Limes")
    table.text("description").nullable(); // A short blurb about the resource
    table.string("url", 2048).notNullable(); // The actual link to the external site/video/profile
    table.string("category", 100).notNullable(); // e.g., 'Vegan Cooks', 'Gardening', 'Sustainable Living', 'Masterclass', 'Restaurants'
    table.string("image_url", 2048).nullable(); // Optional: URL for an icon or thumbnail (e.g., channel logo, blog header)
    table.timestamps(true, true); // created_at and updated_at columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("resources");
};

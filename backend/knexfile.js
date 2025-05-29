// backend/knexfile.js

require("dotenv").config({
  path: require("path").resolve(__dirname, ".env"),
});

// --- ADD THESE CONSOLE.LOGS ---
console.log("--- Debugging Knexfile.js Environment Variables ---");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log(
  "DB_PASSWORD (partial):",
  process.env.DB_PASSWORD
    ? process.env.DB_PASSWORD.substring(0, 3) + "..."
    : "Not set"
);
console.log("--- End Debug ---");
// --- END CONSOLE.LOGS ---

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};

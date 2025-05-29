// backend/seeds/03_seed_seasons.js

exports.seed = async function (knex) {
  await knex("seasons").del();
  await knex("seasons").insert([
    { name: "Spring" },
    { name: "Summer" },
    { name: "Autumn" },
    { name: "Winter" },
    { name: "Year-Round" },
  ]);
};

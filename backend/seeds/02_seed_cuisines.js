// backend/seeds/02_seed_cuisines.js

exports.seed = async function (knex) {
  await knex("cuisines").del();
  await knex("cuisines").insert([
    { name: "American" },
    { name: "Italian" },
    { name: "Mexican" },
    { name: "Asian" },
    { name: "Mediterranean" },
    { name: "French" },
    { name: "Middle Eastern" },
    { name: "African" },
    { name: "South American" },
    { name: "Caribbean" },
    { name: "Nordic" },
    { name: "Fusion" },
  ]);
};

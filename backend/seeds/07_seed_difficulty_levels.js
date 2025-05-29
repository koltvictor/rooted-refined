// backend/seeds/07_seed_difficulty_levels.js

exports.seed = async function (knex) {
  await knex("difficulty_levels").del();
  await knex("difficulty_levels").insert([
    { name: "Beginner", level_order: 1 },
    { name: "Easy", level_order: 2 },
    { name: "Intermediate", level_order: 3 },
    { name: "Advanced", level_order: 4 },
    { name: "Expert", level_order: 5 },
  ]);
};

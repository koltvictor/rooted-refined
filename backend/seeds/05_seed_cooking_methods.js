// backend/seeds/05_seed_cooking_methods.js

exports.seed = async function (knex) {
  await knex("cooking_methods").del();
  await knex("cooking_methods").insert([
    { name: "Baking" },
    { name: "Roasting" },
    { name: "Sautéing" },
    { name: "Grilling" },
    { name: "Stovetop" },
    { name: "Slow Cooker" },
    { name: "Instant Pot" },
    { name: "Air Fryer" },
    { name: "No-Cook" },
    { name: "Steaming" },
    { name: "Blender" },
  ]);
};

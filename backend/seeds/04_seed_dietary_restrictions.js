// backend/seeds/04_seed_dietary_restrictions.js

exports.seed = async function (knex) {
  await knex("dietary_restrictions").del();
  await knex("dietary_restrictions").insert([
    { name: "Vegan" },
    { name: "Gluten-Free" },
    { name: "Soy-Free" },
    { name: "Nut-Free" },
    { name: "Oil-Free" },
    { name: "Sugar-Free" },
    { name: "High-Protein" },
    { name: "Low-Carb" },
    { name: "Whole Food Plant-Based" },
    { name: "Raw" },
    { name: "Kid-Friendly" },
    { name: "Pantry-Friendly" },
  ]);
};

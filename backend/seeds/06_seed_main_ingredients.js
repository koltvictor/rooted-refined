// backend/seeds/06_seed_main_ingredients.js

exports.seed = async function (knex) {
  await knex("main_ingredients").del();
  await knex("main_ingredients").insert([
    // Legumes
    { name: "Lentils" },
    { name: "Chickpeas" },
    { name: "Black Beans" },
    { name: "Kidney Beans" },
    { name: "Pinto Beans" },
    { name: "Edamame" },
    // Tofu & Tempeh
    { name: "Tofu" },
    { name: "Tempeh" },
    // Grains
    { name: "Quinoa" },
    { name: "Rice" },
    { name: "Pasta" },
    { name: "Oats" },
    { name: "Farro" },
    { name: "Barley" },
    // Vegetables
    { name: "Broccoli" },
    { name: "Spinach" },
    { name: "Sweet Potato" },
    { name: "Mushrooms" },
    { name: "Carrots" },
    { name: "Bell Peppers" },
    { name: "Cauliflower" },
    { name: "Kale" },
    // Fruits
    { name: "Berries" },
    { name: "Apples" },
    { name: "Bananas" },
    { name: "Avocado" },
    // Nuts & Seeds
    { name: "Almonds" },
    { name: "Walnuts" },
    { name: "Cashews" },
    { name: "Chia Seeds" },
    { name: "Flax Seeds" },
    { name: "Hemp Seeds" },
    // Plant-Based Meats/Alternatives
    { name: "Vegan Sausage" },
    { name: "Vegan Ground Meat" },
    { name: "Jackfruit" },
  ]);
};

// backend/seeds/01_seed_categories.js

exports.seed = async function (knex) {
  // Deletes ALL existing entries from 'categories' table
  await knex("categories").del();

  // Inserts seed entries
  await knex("categories").insert([
    { name: "Breakfast" },
    { name: "Brunch" },
    { name: "Lunch" },
    { name: "Dinner" },
    { name: "Appetizer" },
    { name: "Snack" },
    { name: "Dessert" },
    { name: "Soups & Stews" },
    { name: "Salads" },
    { name: "Main Courses" },
    { name: "Side Dishes" },
    { name: "Beverages" },
    { name: "Baking" },
    { name: "Sauces & Dressings" },
  ]);
};

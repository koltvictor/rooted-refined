// backend/seeds/08_seed_occasions.js

exports.seed = async function (knex) {
  await knex("occasions").del();
  await knex("occasions").insert([
    { name: "Everyday" },
    { name: "Weeknight Meal" },
    { name: "Holiday" },
    { name: "Potluck" },
    { name: "Party" },
    { name: "Meal Prep" },
    { name: "Quick & Easy" },
    { name: "Comfort Food" },
  ]);
};

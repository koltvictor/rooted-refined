// backend/seeds/09_initial_resources.js

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("resources").del();

  // Inserts seed entries
  await knex("resources").insert([
    {
      title: "Pick Up Limes (YouTube)",
      description:
        "Beautifully produced vegan recipes, lifestyle content, and nutrition advice from a registered dietitian.",
      url: "https://www.youtube.com/@PickUpLimes", // CORRECTED: Actual YouTube channel URL
      category: "vegan cooks",
      image_url:
        "https://www.pickuplimes.com/static/images/logo/pul_logo_main_flat_987_247.9cf5ed7b1374.png",
    },
    {
      title: "Minimalist Baker",
      description:
        "Simple, delicious vegan and gluten-free recipes that require 10 ingredients or less, 1 bowl, or 30 minutes or less to prepare.",
      url: "https://minimalistbaker.com/",
      category: "vegan cooks",
      image_url:
        "https://minimalistbaker.com/wp-content/uploads/2024/02/Zucchini-Pesto-Pasta-with-Roasted-Chickpeas-7-1024x1536.jpg",
    },
    {
      title: "The Sustainable Dish (Blog)",
      description:
        "A blog exploring the environmental impact of various food systems, with a focus on regenerative agriculture and ethical sourcing.",
      url: "https://sustainabledish.com/",
      category: "sustainable living",
      image_url:
        "https://images.squarespace-cdn.com/content/v1/66ed68389a1d5469746b6837/87b57526-a494-44e6-a803-4c4dc883856b/SD_Logo_RGB.png?format=1500w",
    },
    {
      title: "Epic Gardening (YouTube)",
      description:
        "Comprehensive guides for urban gardening, raised beds, composting, and growing food in small spaces.",
      url: "https://www.youtube.com/@EpicGardening", // CORRECTED: Actual YouTube channel URL
      category: "gardening",
      image_url:
        "https://shop.epicgardening.com/cdn/shop/files/Epic_Gardening_Green_FillColor_RGB.png?v=1712779139&width=160",
    },
    {
      title: "MasterClass: Thomas Keller Teaches Cooking Techniques",
      description:
        "Learn foundational cooking techniques from one of the world's most acclaimed chefs. While not all plant-based, the techniques are universal.",
      url: "https://www.masterclass.com/classes/thomas-keller-teaches-cooking-techniques",
      category: "masterclass",
      image_url: "https://i.ytimg.com/vi/Tk9Yh-769o8/maxresdefault.jpg",
    },
    {
      title: "11 Madison Park (Restaurant)",
      description:
        "World-renowned fine dining restaurant in New York City, offering a fully plant-based tasting menu that showcases seasonal ingredients.",
      url: "https://www.11madisonpark.com/",
      category: "restaurants",
      image_url:
        "https://images.squarespace-cdn.com/content/v1/661d75b635d9930903bb9d39/525e8347-df31-4eef-8833-f02fc4db7f9c/ElevenMadisonPark-Leaves_Wordmark.png?format=1500w",
    },
  ]);
};

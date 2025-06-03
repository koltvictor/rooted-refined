// frontend/src/pages/AboutPage.tsx

import React from "react";
import myPhoto from "../assets/kolt.jpg"; // Adjust the path as necessary
import "./AboutPage.css";

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      <header className="about-header">
        <h1 className="about-title">About Kolt's Table</h1>
      </header>

      <div className="about-photo-wrapper">
        <img
          src={myPhoto}
          alt="Kolt Designs - About Me"
          className="about-photo"
        />
      </div>

      <section className="about-section about-intro">
        <p>
          Welcome to Kolt's Table, a place where culinary artistry meets the
          pure, vibrant essence of nature. My journey into the kitchen began in
          childhood, not just as a pastime, but as a fascinating dance between
          art and chemistry. It was truly enchanting to discover how simple
          ingredients could transform—not only into something stunningly
          delicious and beautiful, but also profoundly nourishing. This early
          spark ignited a lifelong passion, not just for cooking, but for the
          immense joy found in sharing unforgettable meals.
        </p>
        <br />
        <h2 className="section-title">
          My Culinary Philosophy: A Celebration of Plants
        </h2>
        <p>
          At Kolt's Table, every dish is a heartfelt testament to the boundless
          possibilities and extraordinary flavors of the plant kingdom. My
          philosophy centers on unlocking the incredible, often-untapped
          potential of seasonal vegetables, fruits, grains, and legumes,
          revealing a world of diverse textures and tastes far beyond anything
          you might expect.
        </p>
        <p>
          I'm deeply committed to seasonal abundance, sourcing ingredients
          straight from my own garden or local farmer's markets to ensure peak
          freshness and unparalleled flavor. My approach is rooted in using only
          pure, unprocessed ingredients, meticulously prepared from scratch.
          This isn't just about health; it's about honoring each ingredient and
          allowing its natural essence to truly sing through refined, thoughtful
          techniques.
        </p>
        <p>
          This path truly crystallized as I sought to create exceptional meals
          for my partner, who embraces a plant-centric diet. Disheartened by the
          limited and often artificial options available, I felt a deep drive to
          prove that plant-forward cuisine could be both incredibly elegant and
          profoundly satisfying, without relying on processed substitutes. The
          sheer happiness of crafting such honest, vibrant, and delicious
          food—knowing it leaves you feeling wonderful—quickly became my guiding
          culinary purpose. Imagine: a healthier, incredibly flavorful, and
          often more economical way to experience food, rich with an infinite
          variety of edible wonders.
        </p>
      </section>

      <section className="about-section about-ethos">
        <h2 className="section-title">
          Inspired by Greatness, Driven by Purpose
        </h2>
        <p>
          My culinary journey is continually shaped by the profound wisdom and
          groundbreaking techniques of masters. I've immersed myself in the
          works of chefs like Thomas Keller—my guiding light, whose subtle
          brilliance and meticulous approach I endlessly strive to
          emulate—Dominique Crenn, Massimo Bottura, Grant Achatz, and Yotam
          Ottolenghi. These visionary chefs inspire me not only with their
          elevated artistry but also with their profound commitment to
          sustainability and ingenuity. They've shown how to create
          extraordinary culinary ecosystems, minimizing waste by utilizing every
          part of the harvest and fostering practices that benefit both the
          planet and the human body. This dedication to both exquisite flavor
          and environmental stewardship, achieved at the highest level, is what
          truly fuels my own drive to craft dishes that are both amazing and
          responsible. It's about achieving refined elegance without pretension,
          ensuring every single bite is a harmonious delight, and knowing it's a
          step toward a more sustainable and delicious future.
        </p>
      </section>

      <section className="about-section about-ethos">
        <h2 className="section-title">
          More Than Just Food: It's My Love Language
        </h2>
        <p>
          For me, cooking transcends a mere craft; it's a profound expression of
          love. There’s an immense, heartwarming satisfaction in nurturing
          people through food, in seeing smiles bloom around the table, and in
          witnessing the pure delight that dances in their eyes with every
          taste. Food and cooking truly are my love language—a powerful, tender
          way to connect, comfort, and celebrate.
        </p>
        <p>
          Through Kolt's Table, my heartfelt aim is to share this passion, this
          expertise, and this joyful approach with you. Each recipe, video, and
          piece of content is crafted to ignite your own curiosity and empower
          you to explore the boundless world of seasonal, unprocessed,
          plant-centric cooking. Join me on this delicious adventure, and let's
          discover together just how incredibly tasty, accessible, and truly
          delightful a plant-forward plate can be.
        </p>
        <p>
          My greatest hope is that these recipes don't just fill your belly, but
          also inspire your spirit, spark your creativity, and bring a deep,
          satisfying joy to your own kitchen.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;

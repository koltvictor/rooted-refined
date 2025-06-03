// frontend/src/pages/AboutPage.tsx

import React from "react";
import myPhoto from "../assets/kolt.jpg"; // Adjust the path as necessary
import "./AboutPage.css";

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      <header className="about-header">
        <h1 className="about-title">About Kolt's Table</h1>
        <p className="about-subtitle">
          Your Path to a Flavorful, Sustainable Life
        </p>{" "}
        {/* New subtitle */}
      </header>

      <div className="about-photo-wrapper">
        <img
          src={myPhoto}
          alt="Kolt's Table - Chef Kolt"
          className="about-photo"
        />
      </div>

      <section className="about-section about-intro">
        <h2 className="section-title">
          It All Started with a Little Chemistry and Magic
        </h2>
        <p>
          Unlike most, I never learned to cook from a family recipe or a formal
          lesson. For me, food was always this incredible blend of{" "}
          <strong>chemistry and magic</strong>. As a kid, my kitchen was a
          playground of intuition. I’d grab ingredients, guided purely by how
          they smelled, how they tasted raw, and the sheer wonder of how
          different elements might dance together. I didn't follow a recipe
          until much later in life; it was all about experimenting, trusting my
          gut, and chasing that next exciting flavor discovery.
        </p>
        <p>
          This wild, unscripted start ignited a deep, fiery passion. It wasn't
          just about cooking; it was about transforming simple, raw ingredients
          into something surprisingly beautiful, profoundly nourishing, and
          deeply satisfying. This early spark evolved into Kolt's Table – my
          dedication to sharing that joy and showing you just how incredible
          real food can be.
        </p>
      </section>

      <section className="about-section about-philosophy">
        <h2 className="section-title">
          My Philosophy: Unleash the Power of Plants
        </h2>
        <p>
          At Kolt's Table, every dish is a heartfelt testament to the
          <strong>
            {" "}
            boundless possibilities and explosive flavors of the plant kingdom
          </strong>
          . My philosophy cuts straight to the heart of it: unlocking the
          incredible, often-untapped potential of seasonal vegetables, fruits,
          grains, and legumes. We're talking textures, tastes, and experiences
          that will blow away any expectations you might have about
          plant-forward eating.
        </p>
        <p>
          My commitment is rooted in{" "}
          <strong>seasonal abundance and pure, unprocessed ingredients</strong>.
          Many come straight from my own garden, others from local farmer's
          markets, ensuring peak freshness and unparalleled flavor. This isn't
          just about what's healthy; it's about honoring each ingredient,
          respecting its natural essence, and letting its true character shine
          through simple, thoughtful techniques. You won't find highly processed
          substitutes here – just honest, vibrant food.
        </p>
        <p>
          This approach truly clicked when I started cooking for my partner, who
          lives a plant-centric life. Frustrated by the limited, often
          artificial options out there, I was driven to prove that plant-forward
          cuisine could be both{" "}
          <strong>unbelievably elegant and profoundly satisfying</strong>. The
          sheer happiness of crafting honest, vibrant, and delicious food that
          leaves you feeling incredible quickly became my guiding purpose.
          Imagine: a healthier, wildly flavorful, and often more economical way
          to eat, bursting with an infinite variety of edible wonders. That's
          the power of Kolt's Table.
        </p>
      </section>

      <section className="about-section about-inspiration">
        <h2 className="section-title">
          Inspired by the Best, Driven by Purpose
        </h2>
        <p>
          My culinary journey is continually shaped by the profound wisdom and
          groundbreaking techniques of culinary masters. I’ve thrown myself into
          the works of chefs like <strong>Thomas Keller</strong>—my ultimate
          guiding light, whose subtle brilliance and meticulous approach I
          endlessly strive to emulate—Dominique Crenn, Massimo Bottura, Grant
          Achatz, and Yotam Ottolenghi. These aren't just names; they're titans
          who inspire me with their elevated artistry and their deep commitment
          to sustainability and ingenuity.
        </p>
        <p>
          They’ve shown how to create extraordinary culinary ecosystems:
          minimizing waste, utilizing every part of the harvest, and fostering
          practices that benefit both the planet and the human body. This
          dedication to both{" "}
          <strong>exquisite flavor and environmental stewardship</strong>,
          achieved at the highest level, fuels my own drive. It's about crafting
          dishes that are both amazing and responsible – achieving refined
          elegance without pretension, ensuring every single bite is a
          harmonious delight, and knowing it's a powerful step toward a more
          sustainable and delicious future.
        </p>
      </section>

      <section className="about-section about-heart">
        <h2 className="section-title">
          More Than Just Food: It's My Love Language
        </h2>
        <p>
          For me, cooking transcends a mere craft; it's a{" "}
          <strong>profound expression of love</strong>. There’s an immense,
          heartwarming satisfaction in nurturing people through food, in seeing
          genuine smiles bloom around the table, and in witnessing the pure
          delight that dances in their eyes with every single taste. Food and
          cooking truly are my love language—a powerful, tender way to connect,
          comfort, and celebrate.
        </p>
        <p>
          Through Kolt's Table, my heartfelt aim is to share this passion, this
          expertise, and this joyful approach with you. Every recipe, video, and
          piece of content here is crafted to ignite your own curiosity and{" "}
          <strong>empower you to explore your unique path</strong> in the
          boundless world of seasonal, unprocessed, plant-centric cooking. Join
          me on this delicious adventure, and let's discover together just how
          incredibly tasty, accessible, and truly delightful a plant-forward
          plate can be.
        </p>
        <p className="final-thought">
          My greatest hope isn't just to fill your belly, but to ignite your
          spirit, spark your creativity, and bring a deep, satisfying joy to
          your own kitchen. This is your table, too.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;

// frontend/src/pages/AboutPage.tsx

import React from "react";
import myPhoto from "../assets/kolt.jpg"; // Adjust the path as necessary
import "./AboutPage.css";

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      <header className="about-header">
        <h1 className="about-title">About Rooted & Refined</h1>
        <p className="about-subtitle">My Culinary Journey & Ethos</p>
      </header>

      <div className="about-photo-wrapper">
        <img
          src={myPhoto}
          alt="Kolt Designs - About Me"
          className="about-photo"
        />
      </div>

      <section className="about-section about-intro">
        <h2 className="section-title">The Roots of My Passion</h2>
        <p>
          My journey into the culinary world began not in a gleaming
          professional kitchen, but in the sun-drenched gardens and bustling
          home kitchens of my childhood. I grew up understanding that food was
          more than just sustenance; it was a language of love, a vessel for
          tradition, and a powerful expression of creativity. Every herb pulled
          from the earth, every vegetable harvested, every meal shared at a
          communal table cemented my belief in the inherent beauty and profound
          impact of well-prepared food.
        </p>
        <p>
          From those early explorations, my path has been one of continuous
          discovery. I've immersed myself in diverse culinary traditions, from
          the meticulous precision of classical techniques to the bold flavors
          of global street food. Each experience has layered upon the last,
          building a foundation of knowledge and intuition that guides my hands
          and inspires my palate.
        </p>
      </section>

      <section className="about-section about-ethos">
        <h2 className="section-title">My Culinary Ethos: Rooted & Refined</h2>
        <p>
          "Rooted & Refined" encapsulates the heart of my cooking philosophy.
          It's a dedication to ingredients that are **rooted** in authenticity –
          seasonal, high-quality, and often locally sourced. I believe truly
          exceptional food starts with respect for the earth and its bounty.
          This means celebrating the natural flavors of produce, the integrity
          of ethically raised proteins, and the nuanced notes of artisanal
          staples.
        </p>
        <p>
          But "rooted" also extends to tradition. I find immense value in the
          wisdom passed down through generations of cooks, in the techniques
          that have stood the test of time, and in the comfort of classic
          dishes.
        </p>
        <p>
          Simultaneously, my approach is **refined**. This isn't about
          unnecessary complexity, but about elevating the familiar through
          thoughtful technique, balanced flavors, and elegant presentation. It's
          about understanding how each element contributes to the whole,
          ensuring every bite is a harmonious experience. It's the art of taking
          simple, honest ingredients and transforming them into something
          extraordinary, a testament to the idea that refinement can be achieved
          without pretension.
        </p>
      </section>

      <section className="about-section about-invitation">
        <h2 className="section-title">Join Me on This Culinary Adventure</h2>
        <p>
          Through this website, I aim to share not just recipes, but a piece of
          my culinary soul. Each dish here has been meticulously crafted,
          tested, and imbued with the "Rooted & Refined" philosophy. My hope is
          that these recipes inspire you to explore, create, and find your own
          joy in the kitchen.
        </p>
        <p>
          Thank you for being here. Let's create something beautiful together.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;

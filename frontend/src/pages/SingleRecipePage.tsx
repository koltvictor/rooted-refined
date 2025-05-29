// frontend/src/pages/SingleRecipePage.tsx

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./SingleRecipePage.css";
import StarRating from "../components/StarRating/StarRating";

// Define a type for a single recipe with ingredients (matching backend response)
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface SingleRecipe {
  id: number;
  title: string;
  description?: string;
  instructions: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  image_url?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: number;
  username?: string;
  ingredients: Ingredient[];
  average_rating: number;
  total_ratings: number;
  current_user_rating: number;
}

const SingleRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<SingleRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const location = useLocation();

  const [avgRating, setAvgRating] = useState(0);
  const [numRatings, setNumRatings] = useState(0);
  const [userCurrentRating, setUserCurrentRating] = useState(0);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("Recipe ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/recipes/${id}`);
        const recipeData = response.data;

        setRecipe(recipeData);
        setIsFavorited(
          location.state?.isFavorited || recipeData.isFavorited || false
        );
        setAvgRating(parseFloat(recipeData.average_rating || 0));
        setNumRatings(parseInt(recipeData.total_ratings || 0));
        setUserCurrentRating(parseFloat(recipeData.current_user_rating || 0));
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching recipe:", err);
        if (err.response && err.response.status === 404) {
          setError("Recipe not found.");
        } else {
          setError("Failed to load recipe details. Please try again later.");
        }
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, location.state?.isFavorited]);

  const canEditDelete =
    recipe && user && (user.id === recipe.user_id || user.is_admin);

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.split("/").pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  };

  const embedVideoSrc = recipe?.video_url
    ? getEmbedUrl(recipe.video_url)
    : null;

  const formatTime = (minutes: number | undefined) => {
    if (minutes === undefined || minutes === null) return "N/A";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let timeString = "";
    if (hours > 0) {
      timeString += `${hours} hr`;
      if (hours > 1) timeString += "s";
    }
    if (remainingMinutes > 0) {
      if (hours > 0) timeString += " ";
      timeString += `${remainingMinutes} min`;
      if (remainingMinutes > 1) timeString += "s";
    }
    if (timeString === "") return "0 mins";
    return timeString;
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Please log in to favorite recipes!");
      return;
    }
    if (!recipe) return;

    try {
      const response = await api.post(`/recipes/${recipe.id}/favorite`);
      setIsFavorited(response.data.favorited);
    } catch (error: any) {
      console.error(
        "Error toggling favorite:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message || "Failed to toggle favorite status."
      );
    }
  };

  const handleRateRecipe = async (rating: number) => {
    if (!user) {
      alert("Please log in to rate recipes!");
      navigate("/login");
      return;
    }
    if (!recipe) return;

    try {
      const response = await api.post(`/recipes/${recipe.id}/rate`, { rating });
      setUserCurrentRating(rating);
      const updatedRecipeResponse = await api.get(`/recipes/${recipe.id}`);

      if (updatedRecipeResponse.data) {
        setAvgRating(
          parseFloat(updatedRecipeResponse.data.average_rating || 0)
        );
        setNumRatings(parseInt(updatedRecipeResponse.data.total_ratings || 0));
      }

      alert(response.data.message);
    } catch (error: any) {
      console.error(
        "Error submitting rating:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          "Failed to submit rating. Please try again."
      );
    }
  };

  // Function to parse instructions and apply bold styling
  const parseInstructions = (instructionsText: string) => {
    // Split the entire instructions string by double newlines first,
    // as that's your general step delimiter.
    // However, for section titles, we'll split by single newlines.
    const lines = instructionsText.split("\n"); // Split by single newlines for initial parsing

    const sections: { title?: string; steps: string[] }[] = [];
    let currentSection: { title?: string; steps: string[] } = { steps: [] }; // Initialize with an empty section

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("*")) {
        // This is a new section title
        // If the currentSection has content, push it to sections array before starting a new one
        if (currentSection.steps.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        // Extract title, removing leading and trailing asterisks
        let title = trimmedLine.substring(1); // Remove leading asterisk
        if (title.endsWith("*")) {
          title = title.substring(0, title.length - 1); // Remove trailing asterisk
        }
        currentSection = { title: title.trim(), steps: [] }; // Start a new section
      } else if (trimmedLine.length > 0) {
        // This is a step, add it to the current section
        currentSection.steps.push(trimmedLine);
      }
      // Ignore empty lines that are not part of a double newline step
    });

    // Push the last collected section if it has content
    if (currentSection.steps.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    return sections.map((section, sectionIndex) => (
      <React.Fragment key={`section-${sectionIndex}`}>
        {section.title && (
          <h3 className="instruction-section-title">{section.title}</h3>
        )}
        {section.steps.length > 0 && (
          <ol className="single-recipe-instructions-list">
            {section.steps.map((step, stepIndex) => (
              <li
                key={`step-${sectionIndex}-${stepIndex}`}
                className="single-recipe-instruction-step"
              >
                {step}
              </li>
            ))}
          </ol>
        )}
      </React.Fragment>
    ));
  };

  if (loading) {
    return <div className="single-recipe-container">Loading recipe...</div>;
  }

  if (error) {
    return <div className="single-recipe-container error">Error: {error}</div>;
  }

  if (!recipe) {
    return (
      <div className="single-recipe-container">No recipe data available.</div>
    );
  }

  return (
    <div className="single-recipe-container">
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="single-recipe-image"
        />
      )}
      {embedVideoSrc && (
        <div className="single-recipe-video-container">
          <iframe
            className="single-recipe-video"
            src={embedVideoSrc}
            title={`${recipe.title} Video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>
      )}
      <h1 className="single-recipe-header">{recipe.title}</h1>
      {recipe.username && (
        <p className="single-recipe-author">By: {recipe.username}</p>
      )}
      <div className="recipe-rating-section">
        <StarRating
          averageRating={avgRating}
          totalRatings={numRatings}
          currentUserRating={userCurrentRating}
          isClickable={!!user}
          onRate={handleRateRecipe}
        />
      </div>
      {recipe.description && (
        <p className="single-recipe-description">{recipe.description}</p>
      )}
      <div className="single-recipe-details-grid">
        <p className="single-recipe-detail-item">
          <strong>Prep Time:</strong> {formatTime(recipe.prep_time_minutes)}
        </p>
        <p className="single-recipe-detail-item">
          <strong>Cook Time:</strong> {formatTime(recipe.cook_time_minutes)}
        </p>
        <p className="single-recipe-detail-item">
          <strong>Servings:</strong> {recipe.servings || "N/A"}
        </p>
      </div>
      <div className="single-recipe-section">
        <h2 className="single-recipe-section-header">Ingredients</h2>
        <ul className="single-recipe-ingredient-list">
          {recipe.ingredients.map((ing, index) => (
            <li key={index} className="single-recipe-ingredient-item">
              {ing.quantity} {ing.unit} {ing.name}{" "}
              {ing.notes && `(${ing.notes})`}
            </li>
          ))}
        </ul>
      </div>
      <div className="single-recipe-section">
        <h2 className="single-recipe-section-header">Instructions</h2>
        {parseInstructions(recipe.instructions)}
      </div>
      {/* Action Buttons */}
      <div className="single-recipe-action-buttons">
        {canEditDelete && (
          <button
            onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
            className="single-recipe-action-button single-recipe-edit-button"
          >
            ✏️ Edit Recipe
          </button>
        )}
        <button
          onClick={handleToggleFavorite}
          disabled={!user}
          className={`single-recipe-action-button single-recipe-like-button ${
            isFavorited ? "is-favorited" : ""
          }`}
        >
          {isFavorited ? "❤️ Favorited!" : "🤍 Like"}
        </button>
        <button className="single-recipe-action-button single-recipe-print-button">
          🖨️ Print
        </button>
        <button className="single-recipe-action-button single-recipe-share-button">
          🔗 Share
        </button>
        <button className="single-recipe-action-button single-recipe-comment-button">
          💬 Comment
        </button>
      </div>
      <Link to="/recipes" className="single-recipe-back-button">
        ← Back to All Recipes
      </Link>
    </div>
  );
};

export default SingleRecipePage;

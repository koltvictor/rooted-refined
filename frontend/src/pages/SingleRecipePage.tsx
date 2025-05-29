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
  ingredients: Ingredient[]; // Array of ingredients
}

const SingleRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get recipe ID from URL params
  const navigate = useNavigate(); // For redirecting to edit page
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
        const recipeData = response.data; // Store response.data in a variable for clarity

        setRecipe(recipeData);
        setIsFavorited(
          location.state?.isFavorited || recipeData.isFavorited || false
        );

        // <--- NEW: Extract rating data from recipeData and set state
        setAvgRating(parseFloat(recipeData.average_rating || 0)); // Ensure it's a number
        setNumRatings(parseInt(recipeData.total_ratings || 0)); // Ensure it's a number
        setUserCurrentRating(parseFloat(recipeData.current_user_rating || 0)); // Ensure it's a number
        // --- END NEW ---

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
  }, [id, location.state?.isFavorited]); // Re-fetch if ID changes

  const canEditDelete =
    recipe && user && (user.id === recipe.user_id || user.is_admin);

  // Function to get YouTube/Vimeo embed URL
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
    return null; // Not a recognized video URL
  };

  const embedVideoSrc = recipe?.video_url
    ? getEmbedUrl(recipe.video_url)
    : null; // <--- NEW

  // Helper function to format time (e.g., 90 minutes -> 1 hr 30 mins)
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
      // Optionally, redirect to login or show a message
      alert("Please log in to favorite recipes!");
      return;
    }
    if (!recipe) return; // Should not happen if button is shown

    try {
      // The backend returns { favorited: true/false }
      const response = await api.post(`/recipes/${recipe.id}/favorite`);
      setIsFavorited(response.data.favorited); // Update local state based on backend response
      // Optionally, show a brief success message
      // setMessage(response.data.message); // If you have a message state
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

  if (loading) {
    return <div className="single-recipe-container">Loading recipe...</div>;
  }

  if (error) {
    return <div className="single-recipe-container error">Error: {error}</div>;
  }

  if (!recipe) {
    return (
      <div className="single-recipe-container">No recipe data available.</div>
    ); // Should not happen with error handling
  }

  const handleRateRecipe = async (rating: number) => {
    if (!user) {
      alert("Please log in to rate recipes!");
      navigate("/login"); // Redirect to login
      return;
    }
    if (!recipe) return;

    try {
      const response = await api.post(`/recipes/${recipe.id}/rate`, { rating });
      // Update local state optimisticially or refetch if necessary
      setUserCurrentRating(rating); // Update user's own rating
      // To get the new average, it's safer to re-fetch the recipe or calculate
      // For simplicity, let's assume backend sends back updated average.
      // If not, you'd need a separate endpoint for average or re-fetch whole recipe.
      // For now, let's re-fetch the recipe to get the latest average and total
      // This is less performant but ensures data consistency.
      const updatedRecipeResponse = await api.get(`/recipes/${recipe.id}`);
      setAvgRating(updatedRecipeResponse.data.average_rating);
      setNumRatings(updatedRecipeResponse.data.total_ratings);
      alert(response.data.message); // Show success message
    } catch (error: any) {
      console.error(
        "Error submitting rating:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          "Failed to submit rating. Please try again."
      );
      // Revert UI if API call failed
      // setUserCurrentRating(userCurrentRating); // Or original rating if stored
    }
  };

  return (
    <div className="single-recipe-container">
      {" "}
      {/* Assuming you've moved styles to SingleRecipePage.css */}
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="single-recipe-image"
        />
      )}
      {embedVideoSrc && ( // <--- NEW: Display video if URL exists
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
          isClickable={!!user} // Only clickable if user is logged in
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
        {/* <--- NEW: Split instructions by double newline and render as numbered list */}
        <ol className="single-recipe-instructions-list">
          {recipe.instructions.split("\n\n").map((step, index) => (
            <li key={index} className="single-recipe-instruction-step">
              {step.trim()}
            </li>
          ))}
        </ol>
      </div>
      {/* Action Buttons */}
      <div className="single-recipe-action-buttons">
        {canEditDelete && ( // <--- NEW: Conditional Edit button
          <button
            onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
            className="single-recipe-action-button single-recipe-edit-button"
          >
            ✏️ Edit Recipe
          </button>
        )}
        <button
          onClick={handleToggleFavorite}
          // Only allow logged-in users to click
          disabled={!user}
          // Apply a class based on isFavorited state for styling
          className={`single-recipe-action-button single-recipe-like-button ${
            isFavorited ? "is-favorited" : ""
          }`}
        >
          {isFavorited ? "❤️ Favorited!" : "🤍 Like"}{" "}
          {/* Change text based on status */}
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

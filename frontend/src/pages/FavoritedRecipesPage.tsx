import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api.ts";
import { useAuth } from "../hooks/useAuth";
import "./FavoritedRecipesPage.css";
import axios from "axios";
import type { BackendErrorResponse } from "../types/index.ts";

interface FavoritedRecipe {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  username?: string;
}

const FavoritedRecipesPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [favoritedRecipes, setFavoritedRecipes] = useState<FavoritedRecipe[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Helper function to format time (copied from SingleRecipePage)
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    const fetchFavoritedRecipes = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<FavoritedRecipe[]>(
          `/recipes/my-favorites`
        );
        setFavoritedRecipes(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError<BackendErrorResponse>(err)) {
          console.error("Error fetching favorited recipes:", err);
          setError(
            err.response?.data?.message || "Failed to load favorited recipes."
          );
        } else if (err instanceof Error) {
          console.error("Error fetching favorited recipes:", err.message);
          setError(err.message || "Failed to load favorited recipes.");
        } else {
          console.error(
            "An unknown error occurred fetching favorited recipes:",
            err
          );
          setError(`An unknown error occurred: ${String(err)}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFavoritedRecipes();
    }
  }, [user, authLoading, navigate]);

  // Filter recipes based on search term and category (placeholder)
  const filteredRecipes = favoritedRecipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // Add category filtering logic here if you implement categories later
    // const matchesCategory = filterCategory === "All" || recipe.category === filterCategory;
    return matchesSearch; // && matchesCategory;
  });

  if (authLoading || loading) {
    return (
      <div className="favorites-container">
        Loading your favorite recipes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-container error-message">Error: {error}</div>
    );
  }

  if (!user) {
    return (
      <div className="favorites-container">
        Please log in to view your favorite recipes.
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <h1 className="favorites-header">My Favorited Recipes</h1>

      <div className="favorites-controls">
        <input
          type="text"
          placeholder="Search in favorites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="favorites-search-input"
        />
        {/* Future: Category Filter Dropdown */}
        {/*
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="favorites-filter-select"
        >
          <option value="All">All Categories</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Dinner">Dinner</option>
        </select>
        */}
      </div>

      {filteredRecipes.length === 0 ? (
        <p className="no-favorites-message">
          {searchTerm
            ? "No matching favorite recipes found."
            : "You haven't favorited any recipes yet!"}
        </p>
      ) : (
        <div className="favorites-grid">
          {filteredRecipes.map((recipe) => (
            <Link
              to={`/recipes/${recipe.id}`} // 'to' prop is now just the path string
              state={{ isFavorited: true }} // 'state' is a separate prop on the Link component
              key={recipe.id}
              className="favorite-card"
            >
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="favorite-card-image"
                />
              )}
              <div className="favorite-card-content">
                <h2 className="favorite-card-title">{recipe.title}</h2>
                {recipe.username && (
                  <p className="favorite-card-author">By: {recipe.username}</p>
                )}
                <div className="favorite-card-details">
                  <p>Prep: {formatTime(recipe.prep_time_minutes)}</p>
                  <p>Cook: {formatTime(recipe.cook_time_minutes)}</p>
                  <p>Servings: {recipe.servings || "N/A"}</p>
                </div>
                {recipe.description && (
                  <p className="favorite-card-description">
                    {recipe.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      <Link to="/recipes" className="favorites-back-button">
        ← Back to All Recipes
      </Link>
    </div>
  );
};

export default FavoritedRecipesPage;

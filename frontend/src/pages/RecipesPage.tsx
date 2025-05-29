// frontend/src/pages/RecipesPage.tsx

import React, { useState, useEffect, useMemo } from "react"; // <--- ADD useMemo
import { Link } from "react-router-dom";
import api from "../api/api";
import "./RecipesPage.css";
import { useDebounce } from "../utils/hooks";

// Define a type for a recipe (matching backend response)
interface Recipe {
  id: number;
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: number;
  username?: string;
}

const RecipesPage: React.FC = () => {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); // <--- NEW: Store ALL (or backend-filtered) recipes
  const [loading, setLoading] = useState(true); // Still for initial/backend fetch state
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Immediate input value

  const debouncedSearchTerm = useDebounce(searchTerm, 300); // <--- Shorter debounce for faster updates

  // <--- NEW: useEffect for backend fetching (only on debounced term change)
  // This hook handles fetching the "master" list of recipes from the backend
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true); // Show loading for backend fetch
      setError(null);

      try {
        const response = await api.get("/recipes", {
          params: {
            search: debouncedSearchTerm, // Use the debounced term for the API call
          },
        });
        setAllRecipes(response.data); // Update the master list of recipes
      } catch (err: any) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes. Please try again later.");
      } finally {
        setLoading(false); // Hide loading after backend fetch
      }
    };

    // Only run this fetch when the debounced term changes (after user pauses typing)
    fetchRecipes();
  }, [debouncedSearchTerm]); // Dependency array: debouncedSearchTerm

  // <--- NEW: Filter recipes *on the frontend* for immediate visual feedback
  // This memoized value updates instantly as 'searchTerm' changes
  const displayedRecipes = useMemo(() => {
    if (!searchTerm) {
      return allRecipes; // If search bar is empty, show all recipes from backend
    }
    // Filter based on the IMMEDIATE searchTerm for instant feedback
    return allRecipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
      // You can add more fields to filter by here (e.g., ingredients, if fetched)
    );
  }, [allRecipes, searchTerm]); // Re-filter when master list or immediate search term changes

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value); // Update searchTerm immediately for input smoothness
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="recipes-page-container">
      <h1 className="recipes-header">The Rooted Collection</h1>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search recipes by title or description..."
          value={searchTerm} // Input value controlled by immediate searchTerm
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={clearSearch} className="clear-search-button">
            X
          </button>
        )}
        {/* Future filter buttons will go here */}
      </div>

      {/* <--- NEW: Conditional rendering for content *below* the search bar */}
      {/*
        Loading state is now more nuanced:
        - If loading AND no recipes have been loaded yet (initial load): show "Loading recipes..."
        - If error: show error message
        - If no recipes to display (either fetched or filtered): show "No recipes found" message
        - Otherwise: show the recipe grid
      */}
      {loading && allRecipes.length === 0 ? ( // Only show full loading screen on initial empty load
        <div className="loading-message">Loading recipes...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : displayedRecipes.length === 0 ? (
        <p className="no-recipes-message">
          {searchTerm
            ? "No recipes found matching your search."
            : "No recipes found. Be the first to add one!"}
        </p>
      ) : (
        <div className="recipe-grid">
          {displayedRecipes.map(
            (
              recipe // Render the FILTERED list
            ) => (
              <div key={recipe.id} className="recipe-card">
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="recipe-image"
                  />
                )}
                <div className="card-content">
                  <h2 className="card-title">{recipe.title}</h2>
                  {recipe.username && (
                    <p className="card-author">By: {recipe.username}</p>
                  )}
                  <p className="card-description">{recipe.description}</p>
                  <Link
                    to={`/recipes/${recipe.id}`}
                    className="view-recipe-button"
                  >
                    View Recipe
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      )}
      {/* Optional: A subtle spinner to indicate a debounced backend fetch is in progress */}
      {loading &&
        allRecipes.length > 0 && ( // Show subtle loader if backend fetch is active and some recipes are already displayed
          <div className="subtle-loader">Loading more...</div>
        )}
    </div>
  );
};

export default RecipesPage;

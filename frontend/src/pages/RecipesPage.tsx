// frontend/src/pages/RecipesPage.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.ts";
import "./RecipesPage.css";
import { useDebounce } from "../utils/hooks";
import { useAuth } from "../context/AuthContext"; // Corrected path if needed, ensure this is correct
import FilterOverlay from "../components/FilterOverlay/FilterOverlay";

// Import all necessary types from the centralized types file
import type {
  Recipe,
  PaginatedRecipesResponse,
  SelectedFilters,
} from "../types/index";

const RecipesPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Consolidated state for currently selected filters (used for API call)
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    categories: [],
    cuisines: [],
    seasons: [],
    dietaryRestrictions: [],
    cookingMethods: [],
    mainIngredients: [],
    difficultyLevels: [],
    occasions: [],
  });

  // State for the filter overlay visibility
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);

  // Debounced search term for API call
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // This ref ensures that initial dietary restrictions are set ONLY ONCE
  // when the component first mounts or user data is initially loaded.
  const initialDietaryRestrictionsSet = useRef(false);

  // Effect to set initial dietary restrictions from user profile on component mount
  // or when the user object initially loads.
  useEffect(() => {
    // Only proceed if auth loading is complete and user data is available
    // and if we haven't already set the initial dietary restrictions for this session.
    if (
      !authLoading &&
      user?.dietary_restrictions &&
      !initialDietaryRestrictionsSet.current
    ) {
      const profileDRIds = user.dietary_restrictions.map((dr) => dr.id);

      setSelectedFilters((prevFilters) => ({
        ...prevFilters,
        dietaryRestrictions: profileDRIds,
      }));
      // Mark that initial dietary restrictions have been set for this session
      initialDietaryRestrictionsSet.current = true;
    }
    // If a user logs out while on the page, reset the flag so that if they log back in
    // during the same session, the initial dietary restrictions are reapplied.
    else if (!authLoading && !user && initialDietaryRestrictionsSet.current) {
      initialDietaryRestrictionsSet.current = false;
      // Optionally clear all filters if user logs out to show all recipes
      setSelectedFilters({
        categories: [],
        cuisines: [],
        seasons: [],
        dietaryRestrictions: [],
        cookingMethods: [],
        mainIngredients: [],
        difficultyLevels: [],
        occasions: [],
      });
    }
  }, [authLoading, user]); // Depend on authLoading and user for this

  // Effect to fetch recipes based on search term and selected filters
  useEffect(() => {
    // Do not fetch recipes until authentication status is resolved.
    if (authLoading) {
      setLoading(true);
      return; // Prevent fetching before user data is ready
    }

    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          search: debouncedSearchTerm,
          categories: selectedFilters.categories.join(","),
          cuisines: selectedFilters.cuisines.join(","),
          seasons: selectedFilters.seasons.join(","),
          dietary_restrictions: selectedFilters.dietaryRestrictions.join(","),
          cooking_methods: selectedFilters.cookingMethods.join(","),
          main_ingredients: selectedFilters.mainIngredients.join(","),
          difficulty_levels: selectedFilters.difficultyLevels.join(","),
          occasions: selectedFilters.occasions.join(","),
        };
        const response = await api.get<PaginatedRecipesResponse>("/recipes", {
          params,
        });
        setAllRecipes(response.data.recipes);
      } catch (err: any) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [
    debouncedSearchTerm,
    selectedFilters, // This dependency is key: changes here trigger a re-fetch
    authLoading,
  ]);

  // Memoized value for instant feedback on search
  const displayedRecipes = useMemo(() => {
    if (!searchTerm) {
      return allRecipes;
    }
    // Filter by title or description based on local searchTerm
    return allRecipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRecipes, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // This callback receives the entire SelectedFilters object from the overlay
  const handleApplyFiltersFromOverlay = (appliedFilters: SelectedFilters) => {
    // When filters are applied from the overlay, update the state.
    // This will cause the main useEffect to re-fetch recipes with the new filters.
    setSelectedFilters(appliedFilters);
    setIsFilterOverlayOpen(false); // Close overlay
  };

  const handleClearAllFiltersFromOverlay = () => {
    // When "Clear All" is clicked, we want to clear ALL filters,
    // including any initial dietary restrictions.
    setSelectedFilters({
      categories: [],
      cuisines: [],
      seasons: [],
      dietaryRestrictions: [], // Explicitly clear dietary restrictions here
      cookingMethods: [],
      mainIngredients: [],
      difficultyLevels: [],
      occasions: [],
    });
    setIsFilterOverlayOpen(false); // Close overlay
    // No need to reset initialDietaryRestrictionsSet.current here,
    // as it relates to the *initial load* behavior, not explicit filter clearing.
  };

  if (authLoading) {
    return (
      <div className="recipes-page-container">
        Authenticating user and loading initial filters...
      </div>
    );
  }

  return (
    <div className="recipes-page-container">
      <h1 className="recipes-header">The Wild Harvest</h1>

      <div className="search-filter-controls">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search recipes by title or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search-button">
              X
            </button>
          )}
        </div>
        <button
          onClick={() => setIsFilterOverlayOpen(true)}
          className="filter-toggle-button"
        >
          Filters
        </button>
      </div>

      <FilterOverlay
        isOpen={isFilterOverlayOpen}
        onClose={() => setIsFilterOverlayOpen(false)}
        onApplyFilters={handleApplyFiltersFromOverlay}
        onClearAllFilters={handleClearAllFiltersFromOverlay}
        initialSelectedFilters={selectedFilters} // Pass the current consolidated state to the overlay
      />

      {/* Main content with recipes */}
      {loading && allRecipes.length === 0 ? (
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
          {displayedRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="recipe-image"
                  loading="lazy"
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
          ))}
        </div>
      )}
      {loading && allRecipes.length > 0 && (
        <div className="subtle-loader">Loading more...</div>
      )}
    </div>
  );
};

export default RecipesPage;

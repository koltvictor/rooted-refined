// frontend/src/pages/RecipesPage.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/api"; // Updated path
import "./RecipesPage.css";
import { useDebounce } from "../utils/hooks";
import { useAuth } from "../context/AuthContext"; // Updated path
import FilterOverlay from "../components/FilterOverlay/FilterOverlay";

// Import all necessary types from the centralized types file
import type {
  Recipe,
  PaginatedRecipesResponse,
  SelectedFilters,
  // User, // Removed 'User' from here if it's not directly used as a type annotation for a variable within this file
} from "../types/index";

const RecipesPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth(); // 'user' implicitly has type User | null from AuthContext

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const initialDietaryRestrictionsSet = useRef(false);

  useEffect(() => {
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
      initialDietaryRestrictionsSet.current = true;
    } else if (!authLoading && !user && initialDietaryRestrictionsSet.current) {
      initialDietaryRestrictionsSet.current = false;
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
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
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
  }, [debouncedSearchTerm, selectedFilters, authLoading]);

  const displayedRecipes = useMemo(() => {
    if (!searchTerm) {
      return allRecipes;
    }
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

  const handleApplyFiltersFromOverlay = (appliedFilters: SelectedFilters) => {
    setSelectedFilters(appliedFilters);
    setIsFilterOverlayOpen(false);
  };

  const handleClearAllFiltersFromOverlay = () => {
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
    setIsFilterOverlayOpen(false);
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
        initialSelectedFilters={selectedFilters}
      />

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

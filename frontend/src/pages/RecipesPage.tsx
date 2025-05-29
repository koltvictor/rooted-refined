// frontend/src/pages/RecipesPage.tsx

import React, { useState, useEffect, useMemo } from "react";
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

interface FilterOption {
  id: number;
  name: string;
  level_order?: number; // For difficulty levels
}

interface FilterOptionsResponse {
  categories: FilterOption[];
  cuisines: FilterOption[];
  seasons: FilterOption[];
  dietaryRestrictions: FilterOption[];
  cookingMethods: FilterOption[];
  mainIngredients: FilterOption[];
  difficultyLevels: FilterOption[];
  occasions: FilterOption[];
}

// --- NEW: Add Interface for Paginated Recipe Response ---
interface PaginatedRecipesResponse {
  recipes: Recipe[];
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}
// --- END NEW ---

const RecipesPage: React.FC = () => {
  console.log("RecipesPage component rendered");

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter-related states
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  // States for currently selected filters (used for API call)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<number[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] =
    useState<number[]>([]);
  const [selectedCookingMethods, setSelectedCookingMethods] = useState<
    number[]
  >([]);
  const [selectedMainIngredients, setSelectedMainIngredients] = useState<
    number[]
  >([]);
  const [selectedDifficultyLevels, setSelectedDifficultyLevels] = useState<
    number[]
  >([]);
  const [selectedOccasions, setSelectedOccasions] = useState<number[]>([]);

  // State for the filter overlay visibility
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);

  // States for filters that are staged/selected in the overlay BEFORE applying
  const [stagedCategories, setStagedCategories] = useState<number[]>([]);
  const [stagedCuisines, setStagedCuisines] = useState<number[]>([]);
  const [stagedSeasons, setStagedSeasons] = useState<number[]>([]);
  const [stagedDietaryRestrictions, setStagedDietaryRestrictions] = useState<
    number[]
  >([]);
  const [stagedCookingMethods, setStagedCookingMethods] = useState<number[]>(
    []
  );
  const [stagedMainIngredients, setStagedMainIngredients] = useState<number[]>(
    []
  );
  const [stagedDifficultyLevels, setStagedDifficultyLevels] = useState<
    number[]
  >([]);
  const [stagedOccasions, setStagedOccasions] = useState<number[]>([]);

  // Debounced search term for API call
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Effect to load filter options on component mount
  useEffect(() => {
    console.log("useEffect: Fetching filter options (on mount)");
    const fetchFilterOptions = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const response = await api.get<FilterOptionsResponse>("/data/filters");
        setFilterOptions(response.data);
      } catch (err: any) {
        console.error("Error fetching filter options:", err);
        setFiltersError(
          err.response?.data?.message || "Failed to load filter options."
        );
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // Effect to fetch recipes based on search term and selected filters
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);

      console.log("Fetching recipes with filters:", {
        search: debouncedSearchTerm,
        categories: selectedCategories,
        cuisines: selectedCuisines,
        seasons: selectedSeasons,
        dietary_restrictions: selectedDietaryRestrictions,
        cooking_methods: selectedCookingMethods,
        main_ingredients: selectedMainIngredients,
        difficulty_levels: selectedDifficultyLevels,
        occasions: selectedOccasions,
      });

      try {
        // --- IMPORTANT CHANGE HERE: Specify response type and access .recipes array ---
        const response = await api.get<PaginatedRecipesResponse>("/recipes", {
          params: {
            search: debouncedSearchTerm,
            categories: selectedCategories.join(","),
            cuisines: selectedCuisines.join(","),
            seasons: selectedSeasons.join(","),
            dietary_restrictions: selectedDietaryRestrictions.join(","),
            cooking_methods: selectedCookingMethods.join(","),
            main_ingredients: selectedMainIngredients.join(","),
            difficulty_levels: selectedDifficultyLevels.join(","),
            occasions: selectedOccasions.join(","),
          },
        });
        // Now, set allRecipes to response.data.recipes
        setAllRecipes(response.data.recipes);
        // You might also want to store pagination info if you plan to use it:
        // setPaginationInfo(response.data);
        // --- END IMPORTANT CHANGE ---
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
    selectedCategories,
    selectedCuisines,
    selectedSeasons,
    selectedDietaryRestrictions,
    selectedCookingMethods,
    selectedMainIngredients,
    selectedDifficultyLevels,
    selectedOccasions,
  ]);

  // Memoized value for instant feedback on search
  const displayedRecipes = useMemo(() => {
    // This part is correct and will receive an array from allRecipes
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

  // Toggles the filter overlay's visibility
  const toggleFilterOverlay = () => {
    setIsFilterOverlayOpen(!isFilterOverlayOpen);
    // When opening, stage the currently active filters for editing
    if (!isFilterOverlayOpen) {
      setStagedCategories([...selectedCategories]);
      setStagedCuisines([...selectedCuisines]);
      setStagedSeasons([...selectedSeasons]);
      setStagedDietaryRestrictions([...selectedDietaryRestrictions]);
      setStagedCookingMethods([...selectedCookingMethods]);
      setStagedMainIngredients([...selectedMainIngredients]);
      setStagedDifficultyLevels([...selectedDifficultyLevels]);
      setStagedOccasions([...selectedOccasions]);
    }
  };

  // Generic handler for checkbox changes in the filter overlay
  const handleCheckboxChange = (
    id: number,
    isChecked: boolean,
    stagedSetter: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    stagedSetter((prev) =>
      isChecked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  // Applies the staged filters to the main selected filters and closes overlay
  const applyFilters = () => {
    console.log("applyFilters: Staged filters about to be set:", {
      stagedCategories,
      stagedCuisines,
      stagedSeasons,
      stagedDietaryRestrictions,
      stagedCookingMethods,
      stagedMainIngredients,
      stagedDifficultyLevels,
      stagedOccasions,
    });

    setSelectedCategories(stagedCategories);
    setSelectedCuisines(stagedCuisines);
    setSelectedSeasons(stagedSeasons);
    setSelectedDietaryRestrictions(stagedDietaryRestrictions);
    setSelectedCookingMethods(stagedCookingMethods);
    setSelectedMainIngredients(stagedMainIngredients);
    setSelectedDifficultyLevels(stagedDifficultyLevels);
    setSelectedOccasions(stagedOccasions);
    setIsFilterOverlayOpen(false); // Close overlay after applying
  };

  // Clears all staged filters and optionally immediately applies them
  const clearAllFilters = (applyImmediately: boolean = false) => {
    setStagedCategories([]);
    setStagedCuisines([]);
    setStagedSeasons([]);
    setStagedDietaryRestrictions([]);
    setStagedCookingMethods([]);
    setStagedMainIngredients([]);
    setStagedDifficultyLevels([]);
    setStagedOccasions([]);

    if (applyImmediately) {
      setSelectedCategories([]);
      setSelectedCuisines([]);
      setSelectedSeasons([]);
      setSelectedDietaryRestrictions([]);
      setSelectedCookingMethods([]);
      setSelectedMainIngredients([]);
      setSelectedDifficultyLevels([]);
      setSelectedOccasions([]);
      setIsFilterOverlayOpen(false);
    }
  };

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
        <button onClick={toggleFilterOverlay} className="filter-toggle-button">
          Filters
        </button>
      </div>

      {/* Filter Overlay */}
      <div className={`filter-overlay ${isFilterOverlayOpen ? "open" : ""}`}>
        {/* ADD THIS NEW WRAPPER HERE */}
        <div className="filter-overlay-content-wrapper">
          <div className="filter-overlay-header">
            <h2>Filter Recipes</h2>
          </div>
          <div className="filter-overlay-content">
            {filtersLoading ? (
              <div>Loading filter options...</div>
            ) : filtersError ? (
              <div style={{ color: "red" }}>Error: {filtersError}</div>
            ) : filterOptions ? (
              <div className="filter-options-grid">
                {/* Categories */}
                <div className="filter-group">
                  <h3>Categories</h3>
                  {filterOptions.categories.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedCategories.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedCategories
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>

                {/* Cuisines */}
                <div className="filter-group">
                  <h3>Cuisines</h3>
                  {filterOptions.cuisines.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedCuisines.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedCuisines
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>

                {/* Seasons */}
                <div className="filter-group">
                  <h3>Seasons</h3>
                  {filterOptions.seasons.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedSeasons.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedSeasons
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>

                {/* Dietary Restrictions */}
                <div className="filter-group">
                  <h3>Dietary Restrictions</h3>
                  {filterOptions.dietaryRestrictions.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedDietaryRestrictions.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedDietaryRestrictions
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>

                {/* Cooking Methods */}
                <div className="filter-group">
                  <h3>Cooking Methods</h3>
                  {filterOptions.cookingMethods.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedCookingMethods.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedCookingMethods
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>

                {/* Main Ingredients */}
                <div className="filter-group">
                  <h3>Main Ingredients</h3>
                  {filterOptions.mainIngredients.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedMainIngredients.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedMainIngredients
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>

                {/* Difficulty Levels */}
                <div className="filter-group">
                  <h3>Difficulty Level</h3>
                  {filterOptions.difficultyLevels
                    .sort(
                      (a, b) =>
                        (a.level_order || 0) - (b.level_order || 0) ||
                        a.name.localeCompare(b.name)
                    )
                    .map((option) => (
                      <label key={option.id} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          value={option.id}
                          checked={stagedDifficultyLevels.includes(option.id)}
                          onChange={(e) =>
                            handleCheckboxChange(
                              option.id,
                              e.target.checked,
                              setStagedDifficultyLevels
                            )
                          }
                        />
                        {option.name}
                      </label>
                    ))}
                </div>

                {/* Occasions */}
                <div className="filter-group">
                  <h3>Occasions</h3>
                  {filterOptions.occasions.map((option) => (
                    <label key={option.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={stagedOccasions.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            option.id,
                            e.target.checked,
                            setStagedOccasions
                          )
                        }
                      />
                      {option.name}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="filter-overlay-footer">
            {/* ADD THE CLOSE BUTTON HERE */}
            <button
              onClick={toggleFilterOverlay}
              className="close-filter-button"
            >
              &times; Close
            </button>
            <button
              onClick={() => clearAllFilters(false)}
              className="clear-all-filters-button"
            >
              Clear All
            </button>
            <button onClick={applyFilters} className="apply-filters-button">
              Apply Filters
            </button>
          </div>
        </div>
        {/* END NEW WRAPPER */}
      </div>

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
      {loading && allRecipes.length > 0 && (
        <div className="subtle-loader">Loading more...</div>
      )}
    </div>
  );
};

export default RecipesPage;

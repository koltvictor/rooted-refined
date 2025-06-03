import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.ts";
import { useAuth } from "../hooks/useAuth";
import axios from "axios"; // Added for error handling
import type { BackendErrorResponse } from "../types/index.ts"; // Added for error handling
import "./AddRecipePage.css";

// Interface for ingredient input fields
interface IngredientInput {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface FilterOption {
  id: number;
  name: string;
  level_order?: number;
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

const AddRecipePage: React.FC = () => {
  // --- ALL HOOKS MUST BE CALLED HERE, UNCONDITIONALLY, AT THE TOP LEVEL ---
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for recipe details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTimeHours, setPrepTimeHours] = useState<string>("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<string>("");
  const [cookTimeHours, setCookTimeHours] = useState<string>("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState<string>("");
  const [servings, setServings] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  // State for ingredients (array of objects)
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: "", quantity: "", unit: "", notes: "" },
  ]);

  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);

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

  // Effect to fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const response = await api.get<FilterOptionsResponse>("/data/filters");
        setFilterOptions(response.data);
      } catch (err: unknown) {
        // Changed 'any' to 'unknown'
        // Type guard for AxiosError
        if (axios.isAxiosError<BackendErrorResponse>(err)) {
          //
          console.error("Error fetching filter options:", err);
          setFiltersError(
            err.response?.data?.message || "Failed to load filter options."
          ); //
        } else if (err instanceof Error) {
          // Handle general Error objects
          console.error("Error fetching filter options:", err.message);
          setFiltersError(err.message || "Failed to load filter options.");
        } else {
          // Handle other unknown error types
          console.error(
            "An unknown error occurred fetching filter options:",
            err
          );
          setFiltersError(`An unknown error occurred: ${String(err)}`);
        }
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // --- Conditional logic AFTER all Hooks are called ---
  // Use useEffect to perform the redirection to avoid calling navigate on every render.
  useEffect(() => {
    // Only redirect if user is not defined (still loading) or not an admin.
    // If user is null (not logged in) or not admin, redirect.
    // If user is loading, wait for authLoading to complete.
    // Assuming useAuth provides an isLoading state, otherwise this might fire prematurely.
    if (user === null || user === undefined || !user.is_admin) {
      navigate("/"); // Or to a 403 forbidden page
    }
  }, [user, navigate]); // Depend on user and navigate

  // If the user is not an admin, don't render the form, but let the useEffect handle navigation.
  // This will render null *after* hooks are called and the redirect is initiated.
  if (user === null || user === undefined || !user.is_admin) {
    return null;
  }
  // --- END Conditional logic ---

  // Handle changes to multi-select filters
  const handleMultiSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((option) => parseInt(option.value));
    setter(values);
  };

  // Handle changes to recipe fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    switch (name) {
      case "title":
        setTitle(value);
        break;
      case "description":
        setDescription(value);
        break;
      case "instructions":
        setInstructions(value);
        break;
      case "servings":
        setServings(value);
        break;
      case "imageUrl":
        setImageUrl(value);
        break;
      case "videoUrl":
        setVideoUrl(value);
        break;
      default:
        break;
    }
  };

  // Handle changes to time input fields (hours/minutes)
  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setter(value);
    }
  };

  // Handle changes to ingredient fields
  const handleIngredientChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [name]: value };
    setIngredients(newIngredients);
  };

  // Add a new ingredient row
  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { name: "", quantity: "", unit: "", notes: "" },
    ]);
  };

  // Remove an ingredient row
  const removeIngredientRow = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const totalPrepTime =
      (prepTimeHours ? parseInt(prepTimeHours) * 60 : 0) +
      (prepTimeMinutes ? parseInt(prepTimeMinutes) : 0);
    const totalCookTime =
      (cookTimeHours ? parseInt(cookTimeHours) * 60 : 0) +
      (cookTimeMinutes ? parseInt(cookTimeMinutes) : 0);

    const formattedIngredients = ingredients
      .filter(
        (ing) =>
          ing.name.trim() !== "" &&
          ing.quantity.trim() !== "" &&
          ing.unit.trim() !== ""
      )
      .map((ing) => ({
        ...ing,
        quantity: parseFloat(ing.quantity),
      }));

    if (formattedIngredients.length === 0) {
      setMessage("Please add at least one valid ingredient.");
      setLoading(false);
      return;
    }

    try {
      const recipeData = {
        title,
        description: description || null,
        instructions,
        prep_time_minutes: totalPrepTime > 0 ? totalPrepTime : null,
        cook_time_minutes: totalCookTime > 0 ? totalCookTime : null,
        servings: servings ? parseInt(servings) : null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        ingredients: formattedIngredients,
        categories: selectedCategories,
        cuisines: selectedCuisines,
        seasons: selectedSeasons,
        dietary_restrictions: selectedDietaryRestrictions,
        cooking_methods: selectedCookingMethods,
        main_ingredients: selectedMainIngredients,
        difficulty_levels: selectedDifficultyLevels,
        occasions: selectedOccasions,
      };

      const response = await api.post("/recipes", recipeData);
      setMessage(response.data.message || "Recipe added successfully!");
      setTitle("");
      setDescription("");
      setInstructions("");
      setPrepTimeHours("");
      setPrepTimeMinutes("");
      setCookTimeHours("");
      setCookTimeMinutes("");
      setServings("");
      setImageUrl("");
      setVideoUrl("");
      setIngredients([{ name: "", quantity: "", unit: "", notes: "" }]);
      setSelectedCategories([]);
      setSelectedCuisines([]);
      setSelectedSeasons([]);
      setSelectedDietaryRestrictions([]);
      setSelectedCookingMethods([]);
      setSelectedMainIngredients([]);
      setSelectedDifficultyLevels([]);
      setSelectedOccasions([]);
      setLoading(false);
      navigate(`/recipes/${response.data.recipeId}`);
    } catch (error: unknown) {
      // Changed from 'any'
      if (axios.isAxiosError<BackendErrorResponse>(error)) {
        //
        console.error(
          "Error adding recipe:",
          error.response?.data || error.message
        );
        setMessage(
          error.response?.data?.message ||
            "Failed to add recipe. Please try again."
        );
      } else if (error instanceof Error) {
        // Handle general Error objects
        console.error("Error adding recipe:", error.message);
        setMessage(error.message || "Failed to add recipe. Please try again.");
      } else {
        // Handle other unknown error types
        console.error("An unknown error occurred adding recipe:", error);
        setMessage(`An unknown error occurred: ${String(error)}`);
      }
      setLoading(false);
    }
  };

  // Render loading/error states for filters only if the user is authorized to view the page
  // This ensures these return statements also come AFTER all hooks.
  if (filtersLoading) {
    return (
      <div className="add-recipe-container">Loading filter options...</div>
    );
  }
  if (filtersError) {
    return (
      <div className="add-recipe-container add-recipe-message error">
        Error loading filter options: {filtersError}
      </div>
    );
  }
  if (!filterOptions) {
    return (
      <div className="add-recipe-container">No filter options available.</div>
    );
  }

  return (
    <div className="add-recipe-container">
      <h2 className="add-recipe-header">Add New Recipe</h2>
      <form onSubmit={handleSubmit} className="add-recipe-form">
        {/* Recipe Details */}
        <div className="add-recipe-section">
          <h3 className="add-recipe-section-header">Recipe Details</h3>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Title:</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={handleChange}
              className="add-recipe-input"
              required
            />
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Description:</label>
            <textarea
              name="description"
              value={description}
              onChange={handleChange}
              className="add-recipe-textarea"
            ></textarea>
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Instructions:</label>
            <textarea
              name="instructions"
              value={instructions}
              onChange={handleChange}
              className="add-recipe-textarea"
              rows={8}
              required
              placeholder="Enter instructions, separating each step with a double newline (press Enter twice)."
            ></textarea>
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Preparation Time:</label>
            <div className="add-recipe-time-input-group">
              <input
                type="number"
                name="prepTimeHours"
                value={prepTimeHours}
                onChange={(e) => handleTimeChange(e, setPrepTimeHours)}
                className="add-recipe-input add-recipe-time-input"
                placeholder="Hours"
                min="0"
              />
              <span className="add-recipe-time-separator">hrs</span>
              <input
                type="number"
                name="prepTimeMinutes"
                value={prepTimeMinutes}
                onChange={(e) => handleTimeChange(e, setPrepTimeMinutes)}
                className="add-recipe-input add-recipe-time-input"
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <span className="add-recipe-time-separator">mins</span>
            </div>
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Cook Time:</label>
            <div className="add-recipe-time-input-group">
              <input
                type="number"
                name="cookTimeHours"
                value={cookTimeHours}
                onChange={(e) => handleTimeChange(e, setCookTimeHours)}
                className="add-recipe-input add-recipe-time-input"
                placeholder="Hours"
                min="0"
              />
              <span className="add-recipe-time-separator">hrs</span>
              <input
                type="number"
                name="cookTimeMinutes"
                value={cookTimeMinutes}
                onChange={(e) => handleTimeChange(e, setCookTimeMinutes)}
                className="add-recipe-input add-recipe-time-input"
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <span className="add-recipe-time-separator">mins</span>
            </div>
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Servings:</label>
            <input
              type="number"
              name="servings"
              value={servings}
              onChange={handleChange}
              className="add-recipe-input"
            />
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Image URL:</label>
            <input
              type="url"
              name="imageUrl"
              value={imageUrl}
              onChange={handleChange}
              className="add-recipe-input"
              placeholder="e.g., https://example.com/my-recipe.jpg"
            />
          </div>
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">
              Video URL (YouTube/Vimeo):
            </label>
            <input
              type="url"
              name="videoUrl"
              value={videoUrl}
              onChange={handleChange}
              className="add-recipe-input"
              placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
          </div>
        </div>

        <div className="add-recipe-section">
          <h3 className="add-recipe-section-header">Recipe Filters</h3>

          {/* Categories */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Categories (Meal Type):</label>
            <select
              multiple
              name="categories"
              value={selectedCategories.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedCategories)
              }
              className="add-recipe-select-multi"
            >
              {filterOptions.categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cuisines */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Cuisines:</label>
            <select
              multiple
              name="cuisines"
              value={selectedCuisines.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedCuisines)}
              className="add-recipe-select-multi"
            >
              {filterOptions.cuisines.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seasons */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Seasons:</label>
            <select
              multiple
              name="seasons"
              value={selectedSeasons.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedSeasons)}
              className="add-recipe-select-multi"
            >
              {filterOptions.seasons.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Restrictions */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">
              Dietary Restrictions/Needs:
            </label>
            <select
              multiple
              name="dietaryRestrictions"
              value={selectedDietaryRestrictions.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedDietaryRestrictions)
              }
              className="add-recipe-select-multi"
            >
              {filterOptions.dietaryRestrictions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cooking Methods */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Cooking Methods:</label>
            <select
              multiple
              name="cookingMethods"
              value={selectedCookingMethods.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedCookingMethods)
              }
              className="add-recipe-select-multi"
            >
              {filterOptions.cookingMethods.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Main Ingredients */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Main Ingredients:</label>
            <select
              multiple
              name="mainIngredients"
              value={selectedMainIngredients.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedMainIngredients)
              }
              className="add-recipe-select-multi"
            >
              {filterOptions.mainIngredients.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Levels */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Difficulty Level:</label>
            <select
              multiple
              name="difficultyLevels"
              value={selectedDifficultyLevels.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedDifficultyLevels)
              }
              className="add-recipe-select-multi"
            >
              {/* Simplified sorting for difficulty levels */}
              {filterOptions.difficultyLevels
                .sort((a, b) => (a.level_order || 0) - (b.level_order || 0))
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Occasions */}
          <div className="add-recipe-form-group">
            <label className="add-recipe-label">Occasions:</label>
            <select
              multiple
              name="occasions"
              value={selectedOccasions.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedOccasions)}
              className="add-recipe-select-multi"
            >
              {filterOptions.occasions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="add-recipe-section">
          <h3 className="add-recipe-section-header">Ingredients</h3>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="add-recipe-ingredient-row">
              <input
                type="text"
                name="name"
                placeholder="Ingredient Name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, e)}
                className="add-recipe-ingredient-input"
                required
              />
              <input
                type="number"
                name="quantity"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, e)}
                className="add-recipe-ingredient-input"
                style={{ width: "60px" }} /* Keep specific width for qty */
                step="0.01"
                required
              />
              <input
                type="text"
                name="unit"
                placeholder="Unit (e.g., cups, grams)"
                value={ingredient.unit}
                onChange={(e) => handleIngredientChange(index, e)}
                className="add-recipe-ingredient-input"
                style={{ width: "120px" }} /* Keep specific width for unit */
                required
              />
              <input
                type="text"
                name="notes"
                placeholder="Notes (e.g., diced, to taste)"
                value={ingredient.notes}
                onChange={(e) => handleIngredientChange(index, e)}
                className="add-recipe-ingredient-input"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  className="add-recipe-button-remove"
                >
                  -
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredientRow}
            className="add-recipe-button-add"
          >
            + Add Ingredient
          </button>
        </div>

        <button
          type="submit"
          className="add-recipe-button-submit"
          disabled={loading}
        >
          {loading ? "Adding Recipe..." : "Add Recipe"}
        </button>
      </form>
      {message && (
        <p
          className={`add-recipe-message ${
            message.includes("Failed") || message.includes("Error")
              ? "error"
              : ""
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default AddRecipePage;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./EditRecipePage.css"; // Import its styles

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
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

// Type for the full recipe data (from backend GET /recipes/:id)
interface RecipeData {
  id: number;
  title: string;
  description?: string;
  instructions: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  image_url?: string;
  video_url?: string; // Add video_url
  user_id?: number; // Creator's user ID
  ingredients: {
    // Array of ingredients from backend
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
  categories?: number[];
  cuisines?: number[];
  seasons?: number[];
  dietary_restrictions?: number[];
  cooking_methods?: number[];
  main_ingredients?: number[];
  difficulty_levels?: number[];
  occasions?: number[];
}

const EditRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get recipe ID from URL
  const navigate = useNavigate();
  const { user } = useAuth(); // Current logged-in user

  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  // Separate states for hours and minutes for prep and cook time
  const [prepTimeHours, setPrepTimeHours] = useState<string>("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<string>("");
  const [cookTimeHours, setCookTimeHours] = useState<string>("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState<string>("");
  const [servings, setServings] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); // State for video URL
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: "", quantity: "", unit: "", notes: "" },
  ]);
  const [recipeOwnerId, setRecipeOwnerId] = useState<number | undefined>(
    undefined
  );

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

  // Helper to convert total minutes to hours and minutes
  const minutesToHoursMinutes = (totalMinutes?: number | null) => {
    if (totalMinutes === undefined || totalMinutes === null) {
      return { hours: "", minutes: "" };
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours: hours.toString(), minutes: minutes.toString() };
  };

  // Fetch recipe data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      setLoadingRecipe(true);
      setError(null);

      try {
        // Fetch all filter options
        const filtersResponse = await api.get<FilterOptionsResponse>(
          "/data/filters"
        );
        setFilterOptions(filtersResponse.data);
        setFiltersLoading(false);

        // Fetch recipe data
        if (!id) {
          setError("Recipe ID is missing.");
          setLoadingRecipe(false);
          return;
        }
        const recipeResponse = await api.get<RecipeData>(`/recipes/${id}`);
        const recipe = recipeResponse.data;

        // Check authorization
        if (user?.id !== recipe.user_id && !user?.is_admin) {
          navigate("/");
          return;
        }

        // Pre-populate form fields
        setTitle(recipe.title);
        setDescription(recipe.description || "");
        setInstructions(recipe.instructions);
        const { hours: prepHrs, minutes: prepMins } = minutesToHoursMinutes(
          recipe.prep_time_minutes
        );
        setPrepTimeHours(prepHrs);
        setPrepTimeMinutes(prepMins);
        const { hours: cookHrs, minutes: cookMins } = minutesToHoursMinutes(
          recipe.cook_time_minutes
        );
        setCookTimeHours(cookHrs);
        setCookTimeMinutes(cookMins);
        setServings(recipe.servings?.toString() || "");
        setImageUrl(recipe.image_url || "");
        setVideoUrl(recipe.video_url || "");
        setRecipeOwnerId(recipe.user_id);

        // Map ingredients to local state format
        setIngredients(
          recipe.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity.toString(),
            unit: ing.unit,
            notes: ing.notes || "",
          }))
        );

        // <--- NEW: Pre-populate selected filter states from fetched recipe
        setSelectedCategories(recipe.categories || []);
        setSelectedCuisines(recipe.cuisines || []);
        setSelectedSeasons(recipe.seasons || []);
        setSelectedDietaryRestrictions(recipe.dietary_restrictions || []);
        setSelectedCookingMethods(recipe.cooking_methods || []);
        setSelectedMainIngredients(recipe.main_ingredients || []);
        setSelectedDifficultyLevels(recipe.difficulty_levels || []);
        setSelectedOccasions(recipe.occasions || []);
        // --- END NEW ---

        setLoadingRecipe(false);
      } catch (err: any) {
        console.error("Error fetching data for edit:", err);
        setError(
          err.response?.data?.message || "Failed to load data for editing."
        );
        setLoadingRecipe(false);
        setFiltersError(
          err.response?.data?.message ||
            "Failed to load filter options for editing."
        ); // Also set filter error
      }
    };
    fetchData();
  }, [id, navigate, user]); // Depend on ID, navigate, and user for auth check

  // Handle changes to multi-select filters (same as AddRecipePage)
  // <--- NEW: Generic handler for multi-select dropdowns/checkboxes
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
        break; // Handle video URL
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
    // Allow empty string (for initial empty state) or valid numbers
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
    setSubmitLoading(true);

    // Calculate total prep and cook times in minutes
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
      setSubmitLoading(false);
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
        video_url: videoUrl || null, // Include video URL
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

      const response = await api.put(`/recipes/${id}`, recipeData); // <--- PUT request
      setMessage(response.data.message || "Recipe updated successfully!");
      setSubmitLoading(false);
      navigate(`/recipes/${id}`); // Redirect to the updated recipe page
    } catch (error: any) {
      console.error(
        "Error updating recipe:",
        error.response?.data || error.message
      );
      setMessage(
        error.response?.data?.message ||
          "Failed to update recipe. Please try again."
      );
      setSubmitLoading(false);
    }
  };

  if (filtersLoading || loadingRecipe) {
    return (
      <div className="edit-recipe-container">
        Loading recipe and filter options...
      </div>
    );
  }

  if (error || filtersError) {
    return (
      <div className="edit-recipe-container" style={{ color: "red" }}>
        Error: {error || filtersError}
      </div>
    );
  }

  if (!filterOptions) {
    // Should not happen if no error
    return (
      <div className="edit-recipe-container">No filter options available.</div>
    );
  }

  return (
    <div className="edit-recipe-container">
      <h2 className="edit-recipe-header">Edit Recipe: {title}</h2>
      <form onSubmit={handleSubmit} className="edit-recipe-form">
        {/* Recipe Details Section */}
        <div className="edit-recipe-section">
          <h3 className="edit-recipe-section-header">Recipe Details</h3>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Title:</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={handleChange}
              className="edit-recipe-input"
              required
            />
          </div>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Description:</label>
            <textarea
              name="description"
              value={description}
              onChange={handleChange}
              className="edit-recipe-textarea"
            ></textarea>
          </div>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Instructions:</label>
            <textarea
              name="instructions"
              value={instructions}
              onChange={handleChange}
              className="edit-recipe-textarea"
              rows={8}
              required
              placeholder="Enter instructions, separating each step with a double newline (press Enter twice)."
            ></textarea>
          </div>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Preparation Time:</label>
            <div className="edit-recipe-time-input-group">
              <input
                type="number"
                name="prepTimeHours"
                value={prepTimeHours}
                onChange={(e) => handleTimeChange(e, setPrepTimeHours)}
                className="edit-recipe-input edit-recipe-time-input"
                placeholder="Hours"
                min="0"
              />
              <span className="edit-recipe-time-separator">hrs</span>
              <input
                type="number"
                name="prepTimeMinutes"
                value={prepTimeMinutes}
                onChange={(e) => handleTimeChange(e, setPrepTimeMinutes)}
                className="edit-recipe-input edit-recipe-time-input"
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <span className="edit-recipe-time-separator">mins</span>
            </div>
          </div>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Cook Time:</label>
            <div className="edit-recipe-time-input-group">
              <input
                type="number"
                name="cookTimeHours"
                value={cookTimeHours}
                onChange={(e) => handleTimeChange(e, setCookTimeHours)}
                className="edit-recipe-input edit-recipe-time-input"
                placeholder="Hours"
                min="0"
              />
              <span className="edit-recipe-time-separator">hrs</span>
              <input
                type="number"
                name="cookTimeMinutes"
                value={cookTimeMinutes}
                onChange={(e) => handleTimeChange(e, setCookTimeMinutes)}
                className="edit-recipe-input edit-recipe-time-input"
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <span className="edit-recipe-time-separator">mins</span>
            </div>
          </div>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Servings:</label>
            <input
              type="number"
              name="servings"
              value={servings}
              onChange={handleChange}
              className="edit-recipe-input"
            />
          </div>
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Image URL:</label>
            <input
              type="url"
              name="imageUrl"
              value={imageUrl}
              onChange={handleChange}
              className="edit-recipe-input"
              placeholder="e.g., https://example.com/my-recipe.jpg"
            />
          </div>
          <div className="edit-recipe-form-group">
            {" "}
            {/* New field for video URL */}
            <label className="edit-recipe-label">
              Video URL (YouTube/Vimeo):
            </label>
            <input
              type="url"
              name="videoUrl"
              value={videoUrl}
              onChange={handleChange}
              className="edit-recipe-input"
              placeholder="e.g., https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        <div className="edit-recipe-section">
          <h3 className="edit-recipe-section-header">Recipe Filters</h3>

          {/* Categories */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Categories (Meal Type):</label>
            <select
              multiple
              name="categories"
              value={selectedCategories.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedCategories)
              }
              className="edit-recipe-select-multi"
            >
              {filterOptions.categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cuisines */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Cuisines:</label>
            <select
              multiple
              name="cuisines"
              value={selectedCuisines.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedCuisines)}
              className="edit-recipe-select-multi"
            >
              {filterOptions.cuisines.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seasons */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Seasons:</label>
            <select
              multiple
              name="seasons"
              value={selectedSeasons.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedSeasons)}
              className="edit-recipe-select-multi"
            >
              {filterOptions.seasons.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Restrictions */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">
              Dietary Restrictions/Needs:
            </label>
            <select
              multiple
              name="dietaryRestrictions"
              value={selectedDietaryRestrictions.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedDietaryRestrictions)
              }
              className="edit-recipe-select-multi"
            >
              {filterOptions.dietaryRestrictions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cooking Methods */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Cooking Methods:</label>
            <select
              multiple
              name="cookingMethods"
              value={selectedCookingMethods.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedCookingMethods)
              }
              className="edit-recipe-select-multi"
            >
              {filterOptions.cookingMethods.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Main Ingredients */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Main Ingredients:</label>
            <select
              multiple
              name="mainIngredients"
              value={selectedMainIngredients.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedMainIngredients)
              }
              className="edit-recipe-select-multi"
            >
              {filterOptions.mainIngredients.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Levels */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Difficulty Level:</label>
            <select
              multiple
              name="difficultyLevels"
              value={selectedDifficultyLevels.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedDifficultyLevels)
              }
              className="edit-recipe-select-multi"
            >
              {filterOptions.difficultyLevels
                .sort(
                  (a, b) =>
                    (a.level_order || 0) - (b.level_order || 0) ||
                    a.name.localeCompare(b.name)
                )
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Occasions */}
          <div className="edit-recipe-form-group">
            <label className="edit-recipe-label">Occasions:</label>
            <select
              multiple
              name="occasions"
              value={selectedOccasions.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedOccasions)}
              className="edit-recipe-select-multi"
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
        <div className="edit-recipe-section">
          <h3 className="edit-recipe-section-header">Ingredients</h3>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="edit-recipe-ingredient-row">
              <input
                type="text"
                name="name"
                placeholder="Ingredient Name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, e)}
                className="edit-recipe-ingredient-input"
                required
              />
              <input
                type="number"
                name="quantity"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, e)}
                className="edit-recipe-ingredient-input-qty"
                step="0.01"
                required
              />
              <input
                type="text"
                name="unit"
                placeholder="Unit (e.g., cups)"
                value={ingredient.unit}
                onChange={(e) => handleIngredientChange(index, e)}
                className="edit-recipe-ingredient-input-unit"
                required
              />
              <input
                type="text"
                name="notes"
                placeholder="Notes (e.g., diced)"
                value={ingredient.notes}
                onChange={(e) => handleIngredientChange(index, e)}
                className="edit-recipe-ingredient-input-notes"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  className="edit-recipe-remove-button"
                >
                  -
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredientRow}
            className="edit-recipe-add-button"
          >
            + Add Ingredient
          </button>
        </div>

        <button
          type="submit"
          className="edit-recipe-submit-button"
          disabled={submitLoading}
        >
          {submitLoading ? "Updating Recipe..." : "Update Recipe"}
        </button>
      </form>
      {message && <p className="edit-recipe-message">{message}</p>}
    </div>
  );
};

export default EditRecipePage;

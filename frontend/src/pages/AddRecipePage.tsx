import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // Our configured Axios instance
import { useAuth } from "../context/AuthContext";

// Interface for ingredient input fields
interface IngredientInput {
  name: string;
  quantity: string; // Use string for input, convert to number before sending
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

const AddRecipePage: React.FC = () => {
  const { user } = useAuth(); // To check if user is admin
  const navigate = useNavigate();

  // Redirect if not admin
  if (!user || !user.is_admin) {
    navigate("/"); // Or to a 403 forbidden page
    return null; // Don't render anything
  }
  // State for recipe details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  // Separate states for hours and minutes for prep and cook time
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

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const response = await api.get("/data/filters");
        setFilterOptions(response.data);
      } catch (err: any) {
        console.error("Error fetching filter options:", err);
        setFiltersError("Failed to load filter options.");
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilterOptions();
  }, []); // Empty dependency array means run once on mount

  // Handle changes to multi-select filters
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
    setLoading(true);

    // Calculate total prep and cook times in minutes
    const totalPrepTime =
      (prepTimeHours ? parseInt(prepTimeHours) * 60 : 0) +
      (prepTimeMinutes ? parseInt(prepTimeMinutes) : 0);
    const totalCookTime =
      (cookTimeHours ? parseInt(cookTimeHours) * 60 : 0) +
      (cookTimeMinutes ? parseInt(cookTimeMinutes) : 0);

    // Prepare ingredients for API (convert quantity to number, filter empty rows)
    const formattedIngredients = ingredients
      .filter(
        (ing) =>
          ing.name.trim() !== "" &&
          ing.quantity.trim() !== "" &&
          ing.unit.trim() !== ""
      )
      .map((ing) => ({
        ...ing,
        quantity: parseFloat(ing.quantity), // Convert string to number
      }));

    if (formattedIngredients.length === 0) {
      setMessage("Please add at least one valid ingredient.");
      setLoading(false);
      return;
    }

    try {
      const recipeData = {
        title,
        description: description || null, // Send null if empty
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
      // Optionally clear form or redirect
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
      navigate(`/recipes/${response.data.recipeId}`); // Redirect to the new recipe page
    } catch (error: any) {
      console.error(
        "Error adding recipe:",
        error.response?.data || error.message
      );
      setMessage(
        error.response?.data?.message ||
          "Failed to add recipe. Please try again."
      );
      setLoading(false);
    }
  };

  if (filtersLoading) {
    return <div style={styles.container}>Loading filter options...</div>;
  }
  if (filtersError) {
    return (
      <div style={{ ...styles.container, color: "red" }}>
        Error loading filter options: {filtersError}
      </div>
    );
  }
  if (!filterOptions) {
    // Should not happen if no error
    return <div style={styles.container}>No filter options available.</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Add New Recipe</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Recipe Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionHeader}>Recipe Details</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title:</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description:</label>
            <textarea
              name="description"
              value={description}
              onChange={handleChange}
              style={styles.textarea}
            ></textarea>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Instructions:</label>
            <textarea
              name="instructions"
              value={instructions}
              onChange={handleChange}
              style={styles.textarea}
              rows={8}
              required
              placeholder="Enter instructions, separating each step with a double newline (press Enter twice)."
            ></textarea>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Preparation Time:</label>
            <div style={styles.timeInputGroup}>
              <input
                type="number"
                name="prepTimeHours"
                value={prepTimeHours}
                onChange={(e) => handleTimeChange(e, setPrepTimeHours)}
                style={{ ...styles.input, ...styles.timeInput }}
                placeholder="Hours"
                min="0"
              />
              <span style={styles.timeSeparator}>hrs</span>
              <input
                type="number"
                name="prepTimeMinutes"
                value={prepTimeMinutes}
                onChange={(e) => handleTimeChange(e, setPrepTimeMinutes)}
                style={{ ...styles.input, ...styles.timeInput }}
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <span style={styles.timeSeparator}>mins</span>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Cook Time:</label>
            <div style={styles.timeInputGroup}>
              <input
                type="number"
                name="cookTimeHours"
                value={cookTimeHours}
                onChange={(e) => handleTimeChange(e, setCookTimeHours)}
                style={{ ...styles.input, ...styles.timeInput }}
                placeholder="Hours"
                min="0"
              />
              <span style={styles.timeSeparator}>hrs</span>
              <input
                type="number"
                name="cookTimeMinutes"
                value={cookTimeMinutes}
                onChange={(e) => handleTimeChange(e, setCookTimeMinutes)}
                style={{ ...styles.input, ...styles.timeInput }}
                placeholder="Minutes"
                min="0"
                max="59"
              />
              <span style={styles.timeSeparator}>mins</span>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Servings:</label>
            <input
              type="number"
              name="servings"
              value={servings}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Image URL:</label>
            <input
              type="url"
              name="imageUrl"
              value={imageUrl}
              onChange={handleChange}
              style={styles.input}
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
              placeholder="e.g., https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionHeader}>Recipe Filters</h3>

          {/* Categories */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Categories (Meal Type):</label>
            <select
              multiple
              name="categories"
              value={selectedCategories.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedCategories)
              }
              className="select-multi" // <--- USE CLASS NAME HERE
            >
              {filterOptions.categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cuisines */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Cuisines:</label>
            <select
              multiple
              name="cuisines"
              value={selectedCuisines.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedCuisines)}
              className="select-multi" // <--- USE CLASS NAME HERE
            >
              {filterOptions.cuisines.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seasons */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Seasons:</label>
            <select
              multiple
              name="seasons"
              value={selectedSeasons.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedSeasons)}
              className="select-multi" // <--- USE CLASS NAME HERE
            >
              {filterOptions.seasons.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Restrictions */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Dietary Restrictions/Needs:</label>
            <select
              multiple
              name="dietaryRestrictions"
              value={selectedDietaryRestrictions.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedDietaryRestrictions)
              }
              className="select-multi" // <--- USE CLASS NAME HERE
            >
              {filterOptions.dietaryRestrictions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cooking Methods */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Cooking Methods:</label>
            <select
              multiple
              name="cookingMethods"
              value={selectedCookingMethods.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedCookingMethods)
              }
              className="select-multi" // <--- USE CLASS NAME HERE
            >
              {filterOptions.cookingMethods.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Main Ingredients */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Main Ingredients:</label>
            <select
              multiple
              name="mainIngredients"
              value={selectedMainIngredients.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedMainIngredients)
              }
              className="select-multi" // <--- USE CLASS NAME HERE
            >
              {filterOptions.mainIngredients.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Levels */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Difficulty Level:</label>
            <select
              multiple
              name="difficultyLevels"
              value={selectedDifficultyLevels.map(String)}
              onChange={(e) =>
                handleMultiSelectChange(e, setSelectedDifficultyLevels)
              }
              className="select-multi" // <--- USE CLASS NAME HERE
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
          <div style={styles.formGroup}>
            <label style={styles.label}>Occasions:</label>
            <select
              multiple
              name="occasions"
              value={selectedOccasions.map(String)}
              onChange={(e) => handleMultiSelectChange(e, setSelectedOccasions)}
              className="select-multi" // <--- USE CLASS NAME HERE
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
        <div style={styles.section}>
          <h3 style={styles.sectionHeader}>Ingredients</h3>
          {ingredients.map((ingredient, index) => (
            <div key={index} style={styles.ingredientRow}>
              <input
                type="text"
                name="name"
                placeholder="Ingredient Name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, e)}
                style={styles.ingredientInput}
                required
              />
              <input
                type="number"
                name="quantity"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, e)}
                style={{ ...styles.ingredientInput, width: "60px" }}
                step="0.01" // Allow decimal quantities
                required
              />
              <input
                type="text"
                name="unit"
                placeholder="Unit (e.g., cups, grams)"
                value={ingredient.unit}
                onChange={(e) => handleIngredientChange(index, e)}
                style={{ ...styles.ingredientInput, width: "120px" }}
                required
              />
              <input
                type="text"
                name="notes"
                placeholder="Notes (e.g., diced, to taste)"
                value={ingredient.notes}
                onChange={(e) => handleIngredientChange(index, e)}
                style={styles.ingredientInput}
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  style={styles.removeButton}
                >
                  -
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredientRow}
            style={styles.addButton}
          >
            + Add Ingredient
          </button>
        </div>

        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? "Adding Recipe..." : "Add Recipe"}
        </button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "30px auto",
    padding: "30px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    color: "#333",
    marginBottom: "30px",
    fontSize: "2em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  section: {
    marginBottom: "30px",
    padding: "20px",
    border: "1px solid #eee",
    borderRadius: "6px",
    backgroundColor: "#fdfdfd",
  },
  sectionHeader: {
    color: "#007bff",
    marginBottom: "20px",
    fontSize: "1.5em",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  formGroup: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#555",
    fontSize: "0.95em",
  },
  input: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1em",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1em",
    resize: "vertical",
    minHeight: "100px",
    boxSizing: "border-box",
  },
  timeInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  timeInput: {
    width: "80px",
    textAlign: "center",
  },
  timeSeparator: {
    fontWeight: "bold",
    color: "#777",
  },
  ingredientRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  ingredientInput: {
    flex: "1",
    minWidth: "100px",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "0.9em",
  },
  addButton: {
    padding: "10px 15px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1em",
    marginTop: "10px",
    alignSelf: "flex-start",
  },
  removeButton: {
    padding: "8px 12px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9em",
  },
  submitButton: {
    padding: "15px 25px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1.2em",
    marginTop: "30px",
    alignSelf: "center",
    width: "fit-content",
  },
  message: {
    textAlign: "center",
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
    borderRadius: "5px",
  },
};

export default AddRecipePage;

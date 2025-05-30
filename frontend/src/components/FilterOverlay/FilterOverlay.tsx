// frontend/src/components/FilterOverlay/FilterOverlay.tsx

import React, { useState, useEffect } from "react";
import api from "../../api/api";
import "./FilterOverlay.css";
import type {
  FilterOption,
  FilterOptionsResponse,
  SelectedFilters,
} from "../../types/index";

// --- Props for FilterOverlay Component (Using imported SelectedFilters) ---
interface FilterOverlayProps {
  isOpen: boolean;
  onApplyFilters: (selectedFilters: SelectedFilters) => void;
  onClose: () => void;
  initialSelectedFilters: SelectedFilters;
  onClearAllFilters: () => void;
}
// --- END Props ---

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onApplyFilters,
  onClose,
  initialSelectedFilters,
  onClearAllFilters,
}) => {
  // States for available filter options (fetched once)
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  // Consolidated state for staged/selected filters within the overlay (local to this component)
  const [stagedFilters, setStagedFilters] = useState<SelectedFilters>({
    categories: [],
    cuisines: [],
    seasons: [],
    dietaryRestrictions: [],
    cookingMethods: [],
    mainIngredients: [],
    difficultyLevels: [],
    occasions: [],
  });

  // Effect to load filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const response = await api.get<FilterOptionsResponse>("/data/filters");
        setFilterOptions(response.data);
      } catch (err: any) {
        // Keep any for now, better handled by global interceptor if possible
        console.error("Error fetching filter options:", err);
        setFiltersError(
          err.response?.data?.message || "Failed to load filter options."
        );
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilterOptions();
  }, []); // Empty dependency array means this runs once on mount

  // Effect to sync initialSelectedFilters from parent to staged filters when overlay opens
  // This ensures the overlay always opens with the currently active filters
  useEffect(() => {
    if (isOpen) {
      setStagedFilters({ ...initialSelectedFilters });
    }
  }, [isOpen, initialSelectedFilters]);

  /**
   * Generic handler for checkbox changes in the filter overlay.
   * Updates the corresponding array within the stagedFilters state object.
   * @param filterType The key of the filter category in SelectedFilters (e.g., 'categories', 'cuisines').
   * @param id The ID of the filter option being toggled.
   * @param isChecked The new checked state of the checkbox.
   */
  const handleCheckboxChange = (
    filterType: keyof SelectedFilters, // 'categories' | 'cuisines' | etc.
    id: number,
    isChecked: boolean
  ) => {
    setStagedFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: isChecked
        ? [...prevFilters[filterType], id]
        : prevFilters[filterType].filter((item) => item !== id),
    }));
  };

  // Handler for "Apply Filters" button click
  const handleApply = () => {
    onApplyFilters(stagedFilters); // Pass the entire stagedFilters object
    onClose(); // Close the overlay after applying
  };

  // Handler for "Clear All" button click
  const handleClearAll = () => {
    onClearAllFilters(); // Parent handles resetting to profile defaults or empty
    onClose(); // Close the overlay
  };

  // Handle clicks outside the overlay content (backdrop)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose(); // Close the overlay if the backdrop is clicked
    }
  };

  // No `if (!isOpen) return null;` here, as CSS handles visibility for smooth transitions.

  // Helper function to render a filter group
  const renderFilterGroup = (
    title: string,
    options: FilterOption[],
    filterType: keyof SelectedFilters,
    sortOptions?: boolean // Optional: pass true to sort Difficulty Levels
  ) => {
    if (!options || options.length === 0) return null;

    const sortedOptions = sortOptions
      ? [...options].sort(
          (a, b) =>
            (a.level_order || 0) - (b.level_order || 0) ||
            a.name.localeCompare(b.name)
        )
      : options;

    return (
      <div className="filter-group">
        <h3>{title}</h3>
        {sortedOptions.map((option) => (
          <label key={option.id} className="filter-checkbox-label">
            <input
              type="checkbox"
              value={option.id}
              checked={stagedFilters[filterType].includes(option.id)}
              onChange={(e) =>
                handleCheckboxChange(filterType, option.id, e.target.checked)
              }
            />
            {option.name}
          </label>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`filter-overlay ${isOpen ? "is-open" : ""}`}
      onClick={handleOverlayClick}
    >
      <div
        className="filter-overlay-content-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-overlay-header">
          <h2>Filter Recipes</h2>
          <button onClick={onClose} className="close-filter-button">
            &times;
          </button>
        </div>
        <div className="filter-overlay-content">
          {filtersLoading ? (
            <div>Loading filter options...</div>
          ) : filtersError ? (
            <div style={{ color: "red" }}>Error: {filtersError}</div>
          ) : filterOptions ? (
            <div className="filter-options-grid">
              {renderFilterGroup(
                "Categories",
                filterOptions.categories,
                "categories"
              )}
              {renderFilterGroup(
                "Cuisines",
                filterOptions.cuisines,
                "cuisines"
              )}
              {renderFilterGroup("Seasons", filterOptions.seasons, "seasons")}
              {renderFilterGroup(
                "Dietary Restrictions",
                filterOptions.dietaryRestrictions,
                "dietaryRestrictions"
              )}
              {renderFilterGroup(
                "Cooking Methods",
                filterOptions.cookingMethods,
                "cookingMethods"
              )}
              {renderFilterGroup(
                "Main Ingredients",
                filterOptions.mainIngredients,
                "mainIngredients"
              )}
              {renderFilterGroup(
                "Difficulty Level",
                filterOptions.difficultyLevels,
                "difficultyLevels",
                true
              )}{" "}
              {/* Pass true to sort */}
              {renderFilterGroup(
                "Occasions",
                filterOptions.occasions,
                "occasions"
              )}
            </div>
          ) : null}
        </div>
        <div className="filter-overlay-footer">
          <button onClick={onClose} className="close-filter-button">
            &times; Close
          </button>
          <button onClick={handleClearAll} className="clear-all-filters-button">
            Clear All
          </button>
          <button onClick={handleApply} className="apply-filters-button">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterOverlay;

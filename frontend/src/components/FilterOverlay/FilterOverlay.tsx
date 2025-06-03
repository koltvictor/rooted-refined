// frontend/src/components/FilterOverlay/FilterOverlay.tsx

import React, { useState, useEffect } from "react";
import api from "../../api/api"; // Updated path if needed
import "./FilterOverlay.css";
import axios, { AxiosError } from "axios"; // Keep AxiosError for the type guard check
import type {
  FilterOption,
  FilterOptionsResponse,
  SelectedFilters,
} from "../../types/index";

interface FilterOverlayProps {
  isOpen: boolean;
  onApplyFilters: (selectedFilters: SelectedFilters) => void;
  onClose: () => void;
  initialSelectedFilters: SelectedFilters;
  onClearAllFilters: () => void;
}

interface BackendErrorResponse {
  message: string;
}

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onApplyFilters,
  onClose,
  initialSelectedFilters,
  onClearAllFilters,
}) => {
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const response = await api.get<FilterOptionsResponse>("/data/filters");
        setFilterOptions(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError<BackendErrorResponse>(err)) {
          // <--- CHANGE IS HERE
          const axiosError: AxiosError<BackendErrorResponse> = err; // <--- AND HERE
          console.error("Error fetching filter options:", axiosError);

          // Safely access message using optional chaining, and provide a fallback
          setFiltersError(
            axiosError.response?.data?.message || // Now TypeScript knows data *might* have a message
              "Failed to load filter options."
          );
        } else if (err instanceof Error) {
          console.error("General error fetching filter options:", err.message);
          setFiltersError(err.message || "An unexpected error occurred.");
        } else {
          console.error("An unknown error occurred:", err);
          setFiltersError(`An unknown error occurred: ${String(err)}`);
        }
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStagedFilters({ ...initialSelectedFilters });
    }
  }, [isOpen, initialSelectedFilters]);

  const handleCheckboxChange = (
    filterType: keyof SelectedFilters,
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

  const handleApply = () => {
    onApplyFilters(stagedFilters);
    onClose();
  };

  const handleClearAll = () => {
    onClearAllFilters();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderFilterGroup = (
    title: string,
    options: FilterOption[],
    filterType: keyof SelectedFilters,
    sortOptions?: boolean
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
              )}
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

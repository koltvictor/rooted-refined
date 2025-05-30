// frontend/src/types/index.ts

/**
 * Defines the structure for a generic filter option.
 * This can represent categories, cuisines, dietary restrictions, etc.
 */
export type FilterOption = {
  id: number;
  name: string;
  level_order?: number; // Optional, specifically for difficulty levels (e.g., for sorting)
};

/**
 * Defines the comprehensive structure for all available filter options
 * returned by the API.
 */
export type FilterOptionsResponse = {
  categories: FilterOption[];
  cuisines: FilterOption[];
  seasons: FilterOption[];
  dietaryRestrictions: FilterOption[];
  cookingMethods: FilterOption[];
  mainIngredients: FilterOption[];
  difficultyLevels: FilterOption[];
  occasions: FilterOption[];
};

/**
 * Defines the structure for selected filters that are passed to the API.
 * These are arrays of IDs.
 */
export type SelectedFilters = {
  categories: number[];
  cuisines: number[];
  seasons: number[];
  dietaryRestrictions: number[];
  cookingMethods: number[];
  mainIngredients: number[];
  difficultyLevels: number[];
  occasions: number[];
};

/**
 * Defines the core structure for a Recipe.
 */
export type Recipe = {
  id: number;
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes?: number | null; // Allow null for optional fields
  cook_time_minutes?: number | null;
  servings?: number | null;
  image_url?: string | null;
  created_at: string; // ISO 8601 string date
  updated_at: string; // ISO 8601 string date
  user_id?: number; // Optional, if creator info is embedded
  username?: string; // Optional, if creator info is embedded
};

/**
 * Defines the structure for a paginated list of recipes.
 */
export type PaginatedRecipesResponse = {
  recipes: Recipe[];
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
};

/**
 * Defines the comprehensive structure for a User profile.
 * This should mirror your backend User/UserProfile model.
 */
export type User = {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  profile_picture_url?: string | null;
  dietary_restrictions?: FilterOption[]; // Uses the centralized FilterOption
  // Add other user profile fields here as they are added to the backend
};

/**
 * Defines the basic user info received upon login/registration before full profile fetch.
 */
export type BasicUser = {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
};

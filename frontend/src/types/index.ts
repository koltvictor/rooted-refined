// frontend/src/types/index.ts

// --- API Response Types ---
export interface PaginatedRecipesResponse {
  recipes: Recipe[];
  totalRecipes: number;
  // page: number; // Add if your API returns pagination info
  // limit: number;
  // totalPages: number;
}

export interface FilterOptionsResponse {
  categories: FilterOption[];
  cuisines: FilterOption[];
  seasons: FilterOption[];
  dietaryRestrictions: FilterOption[];
  cookingMethods: FilterOption[];
  mainIngredients: FilterOption[];
  difficultyLevels: FilterOption[];
  occasions: FilterOption[];
}

// --- General Data Model Types ---
export interface FilterOption {
  id: number;
  name: string;
  level_order?: number; // Optional, specifically for Difficulty Levels
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  instructions: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  image_url?: string; // Optional
  video_url?: string; // Optional
  is_public: boolean;
  average_rating: number; // Add if you have ratings
  total_ratings: number; // Add if you have ratings
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  username: string; // Author's username
  user_id: number; // Author's user ID

  // Add IDs of related entities (normalized data)
  category_id: number;
  cuisine_id: number;
  season_id?: number; // Optional
  difficulty_level_id: number;

  // Arrays of associated IDs (for filtering)
  dietary_restriction_ids: number[];
  cooking_method_ids: number[];
  main_ingredient_ids: number[];
  occasion_ids: number[];
}

// --- User Related Types ---
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  dietary_restrictions: FilterOption[]; // Array of FilterOption objects
}

export interface BasicUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  // Add other basic properties received upon login, if any
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  dietary_restrictions?: FilterOption[];
  is_admin: boolean; // Add is_admin property
}

// --- Filter Overlay Related Types ---
export interface SelectedFilters {
  categories: number[];
  cuisines: number[];
  seasons: number[];
  dietaryRestrictions: number[];
  cookingMethods: number[];
  mainIngredients: number[];
  difficultyLevels: number[];
  occasions: number[];
}

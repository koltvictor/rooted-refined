// frontend/src/context/AuthContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import api from "../api/api"; // Our Axios instance

// --- NEW: Define the shape of FilterOption for dietary restrictions ---
interface FilterOption {
  id: number;
  name: string;
}

// --- MODIFIED: Define the shape of the user object to include full profile ---
interface User {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  profile_picture_url?: string | null;
  dietary_restrictions?: FilterOption[]; // Now includes dietary restrictions
  // Add other profile fields here as they are added to the backend UserProfile
}

// Define the shape of the AuthContext value
interface AuthContextType {
  user: User | null;
  token: string | null;
  // Modify login to accept a partial user, as full profile will be fetched
  login: (
    token: string,
    basicUser: {
      id: number;
      username: string;
      email: string;
      is_admin?: boolean;
    }
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to fetch full user profile and update state
  const fetchAndSetUserProfile = async (
    userId: number,
    currentToken: string
  ) => {
    try {
      // Set Auth header for API request
      api.defaults.headers.common["Authorization"] = `Bearer ${currentToken}`;
      const response = await api.get<User>("/users/profile"); // Backend returns full user profile
      const fullUser = { ...response.data, token: currentToken }; // Combine token with user data
      setUser(fullUser);
      // Update localStorage with full user profile (important for persistence)
      localStorage.setItem("user", JSON.stringify(fullUser));
    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      // If fetching fails, clear auth state to force re-login
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // On initial load, try to retrieve token and user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");

    if (storedToken && storedUserStr) {
      try {
        const basicUser: User = JSON.parse(storedUserStr); // Parse existing basic user data

        // Now, fetch the full profile data
        fetchAndSetUserProfile(basicUser.id, storedToken);
        setToken(storedToken); // Set token immediately
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        logout(); // Clear corrupted data
      }
    } else {
      setIsLoading(false); // No token or user, so loading is complete
    }
  }, []); // Run once on mount

  // Modify login function to accept basicUser and then fetch full profile
  const login = async (
    newToken: string,
    basicUser: {
      id: number;
      username: string;
      email: string;
      is_admin?: boolean;
    }
  ) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    // Temporarily save basic user until full profile is fetched
    localStorage.setItem("user", JSON.stringify(basicUser));
    // Immediately fetch full profile after successful login
    await fetchAndSetUserProfile(basicUser.id, newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"]; // Clear token from Axios headers
  };

  // Add an effect to set/clear Axios Authorization header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

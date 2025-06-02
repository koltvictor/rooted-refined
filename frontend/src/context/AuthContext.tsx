// frontend/src/context/AuthContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api, { setupApiInterceptors } from "../api/api"; // Import both the instance and the setup function
import type { User } from "../types/index"; // Only import User now, BasicUser is implied by the User type

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    newToken: string,
    basicUser: {
      id: number;
      username: string;
      email: string;
      is_admin?: boolean;
    }
  ) => Promise<void>; // BasicUser type can be defined inline or kept
  logout: () => void;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoize the logout function to ensure stability.
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const fetchAndSetUserProfile = useCallback(async () => {
    try {
      // This is where the full user profile including `is_admin` is fetched
      const response = await api.get<User>("/users/profile");
      const fullUser: User = response.data;
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser)); // Store the *full* user object
    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      // If fetching profile fails (e.g., token expired/invalid), log out
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]); // Added logout to dependency array as it's used within useCallback

  // IMPORTANT: Set up Axios interceptors here once on mount.
  useEffect(() => {
    console.log("Setting up API interceptors...");
    setupApiInterceptors(logout);
  }, [logout]);

  // On initial load, try to retrieve token and user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    // Removed storedUserStr as we will rely on fetchAndSetUserProfile for the full user object
    // const storedUserStr = localStorage.getItem("user"); // Removed this line

    if (storedToken) {
      // Only check for token
      setToken(storedToken);
      fetchAndSetUserProfile(); // Always fetch the full profile if a token exists
    } else {
      setIsLoading(false);
    }
  }, [fetchAndSetUserProfile]); // Added fetchAndSetUserProfile to dependency array

  // MODIFIED LOGIN FUNCTION
  const login = async (
    newToken: string,
    initialUserData: {
      id: number;
      username: string;
      email: string;
      is_admin?: boolean;
    }
  ) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    // DO NOT set localStorage.setItem("user", JSON.stringify(initialUserData)); here
    // Instead, rely solely on fetchAndSetUserProfile to get the complete user object
    // and store it in localStorage.
    // This prevents storing an incomplete user object from the initial login response.

    // Immediately set a 'loading' or 'basic' user if you want,
    // but the true source of truth will come from the profile fetch.
    setUser(initialUserData as User); // Temporarily set basic data to show user is logged in
    // This might not have `is_admin` yet.

    await fetchAndSetUserProfile(); // This call will fetch the full user and update the state
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    refreshUserProfile: fetchAndSetUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

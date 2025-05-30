// frontend/src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback, // Import useCallback
} from "react";
import api from "../api/api.ts";
import type { User, BasicUser } from "../types/index";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (newToken: string, basicUser: BasicUser) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>; // Add this to the interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use useCallback to memoize this function, preventing unnecessary re-creations
  const fetchAndSetUserProfile = useCallback(async () => {
    try {
      const response = await api.get<User>("/users/profile");
      const fullUser: User = response.data;
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));
    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      logout(); // Logout if profile fetching fails (e.g., token expired)
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array because it doesn't depend on any external state that would change

  // On initial load, try to retrieve token and user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");

    if (storedToken && storedUserStr) {
      setToken(storedToken);
      // Immediately fetch full profile after successful login.
      // We rely on the Axios interceptor to pick up the token from localStorage.
      fetchAndSetUserProfile(); // Call memoized function
    } else {
      setIsLoading(false);
    }
  }, [fetchAndSetUserProfile]); // Depend on memoized fetchAndSetUserProfile

  const login = async (newToken: string, basicUser: BasicUser) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(basicUser));
    await fetchAndSetUserProfile(); // Call memoized function
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    refreshUserProfile: fetchAndSetUserProfile, // Expose the refresh function
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

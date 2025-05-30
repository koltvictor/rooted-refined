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
import type { User, BasicUser } from "../types/index";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (newToken: string, basicUser: BasicUser) => Promise<void>;
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
    // If you want to force a redirect to login on logout, do it here.
    // For example:
    // window.location.href = '/login'; // This forces a full page reload and clears React state
    // Or, if using react-router-dom's navigate, you'd need access to it here,
    // which is often handled by a wrapper component or a global navigation utility.
  }, []);

  const fetchAndSetUserProfile = useCallback(async () => {
    try {
      const response = await api.get<User>("/users/profile");
      const fullUser: User = response.data;
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));
    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      // The interceptor might have already called logout for 401.
      // If it's another error, we might still want to logout.
      // For robustness, ensure `logout` can be safely called multiple times.
      // (Our `logout` function already is).
      // logout(); // Only if this error is specifically an auth error not caught by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  // IMPORTANT: Set up Axios interceptors here once on mount.
  useEffect(() => {
    console.log("Setting up API interceptors...");
    setupApiInterceptors(logout);
    // This effect should only run once to set up interceptors for the entire app lifecycle.
    // The `logout` dependency is stable due to useCallback.
  }, [logout]);

  // On initial load, try to retrieve token and user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");

    if (storedToken && storedUserStr) {
      setToken(storedToken);
      fetchAndSetUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchAndSetUserProfile]);

  const login = async (newToken: string, basicUser: BasicUser) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(basicUser));
    await fetchAndSetUserProfile();
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

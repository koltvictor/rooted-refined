// frontend/src/context/AuthProvider.tsx

import React, { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import api, { setupApiInterceptors } from "../api/api";
import type { User } from "../types/index";
import { AuthContext } from "./AuthContextDefinition"; // Correct import for AuthContext
import type { AuthContextType } from "./AuthContextDefinition"; // Correct type import

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const fetchAndSetUserProfile = useCallback(async () => {
    try {
      const response = await api.get<User>("/users/profile");
      const fullUser: User = response.data;
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));
    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    console.log("Setting up API interceptors...");
    setupApiInterceptors(logout);
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchAndSetUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchAndSetUserProfile]);

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
    setUser(initialUserData as User);

    await fetchAndSetUserProfile();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    refreshUserProfile: fetchAndSetUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

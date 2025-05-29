// frontend/src/context/AuthContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import api from "../api/api"; // Our Axios instance

// Define the shape of the user object
interface User {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
}

// Define the shape of the AuthContext value
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean; // To indicate if initial loading (checking token) is complete
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

  // On initial load, try to retrieve token and user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Important: Re-fetch user data if needed to get latest is_admin status
        // For simplicity, we'll just use what's in the token for now,
        // but a more robust app might hit a /api/user/me endpoint.
        setUser(parsedUser);
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Modify login function to accept is_admin
  const login = (newToken: string, newUser: User) => {
    // newUser will now contain is_admin from backend login/register response
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // api.defaults.headers.common['Authorization'] = ''; // Clear token from Axios headers
  };

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

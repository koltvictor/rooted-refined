import { createContext } from "react";
import type { User } from "../types/index";

// Define the shape of your context
export interface AuthContextType {
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
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

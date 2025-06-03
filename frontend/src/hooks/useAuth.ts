// frontend/src/hooks/useAuth.ts

import { useContext } from "react";
import { AuthContext } from "../context/AuthContextDefinition"; // This import is sufficient

export const useAuth = () => {
  // Type will be correctly inferred from AuthContext
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

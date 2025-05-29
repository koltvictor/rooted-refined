// frontend/src/App.tsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import AddRecipePage from "./pages/AddRecipePage";
import RecipesPage from "./pages/RecipesPage";
import SingleRecipePage from "./pages/SingleRecipePage";
import EditRecipePage from "./pages/EditRecipePage";
import FavoritedRecipesPage from "./pages/FavoritedRecipesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

// PrivateRoute component (remains the same)
interface PrivateRouteProps {
  children: React.ReactNode;
}
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          fontSize: "18px",
          color: "#555",
        }}
      >
        Loading user data...
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Navbar />

        <div className="app-container">
          <Routes>
            <Route path="/" element={<RecipesPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<SingleRecipePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route
              path="/add-recipe"
              element={
                <PrivateRoute>
                  <AddRecipePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-recipe/:id"
              element={
                <PrivateRoute>
                  <EditRecipePage />
                </PrivateRoute>
              }
            />
            {/* CORRECTED AND CONSOLIDATED FAVORITES ROUTE: */}
            <Route
              path="/my-favorites" // Ensure this matches your Navbar link
              element={
                <PrivateRoute>
                  <FavoritedRecipesPage /> {/* <--- CORRECTED COMPONENT NAME */}
                </PrivateRoute>
              }
            />
            {/* <Route
              path="/pantry"
              element={
                <PrivateRoute>
                  <PantryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/shopping-list"
              element={
                <PrivateRoute>
                  <ShoppingListPage />
                </PrivateRoute>
              }
            /> */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;

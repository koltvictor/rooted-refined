// frontend/src/components/NavBar.tsx

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./NavBar.css";

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();

  console.log("User:", user);
  console.log("Is Admin:", user?.is_admin); // Use optional chaining

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Kolt's Table</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/recipes">All Recipes</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
        <li>
          {" "}
          <Link to="/resources-hub">Resources Hub</Link>{" "}
        </li>
        {user &&
          user.is_admin && ( // Ensure only admin sees Add Recipe
            <li>
              <Link to="/add-recipe">Add Recipe</Link>
            </li>
          )}
        {user && (
          <>
            <li>
              <Link to="/my-favorites">My Favorites</Link>
            </li>

            <li>
              <Link to="/profile">Profile</Link>
            </li>
          </>
        )}
      </ul>
      <div className="navbar-auth">
        {user ? (
          <>
            <span className="navbar-welcome">Hello, {user.username}!</span>
            <button onClick={logout} className="navbar-button logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-button">
              Login
            </Link>
            <Link to="/register" className="navbar-button">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;

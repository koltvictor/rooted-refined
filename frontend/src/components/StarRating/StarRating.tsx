// frontend/src/components/StarRating/StarRating.tsx

import React, { useState, useEffect } from "react";
import "./StarRating.css";

interface StarRatingProps {
  averageRating: number;
  totalRatings: number;
  currentUserRating: number;
  isClickable: boolean;
  onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  averageRating,
  totalRatings,
  currentUserRating,
  isClickable,
  onRate,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(currentUserRating); // User's current selected/saved rating

  // Update displayRating when currentUserRating prop changes (e.g., after successful API call)
  useEffect(() => {
    setDisplayRating(currentUserRating);
  }, [currentUserRating]);

  // <--- MODIFIED: This function now determines which numerical rating affects the stars' *fill amount*.
  // If not hovering and no user rating, it returns 0, making stars empty.
  const getVisualFillAmount = (): number => {
    if (isClickable && hoverRating > 0) {
      return hoverRating; // Hover takes highest precedence for fill amount if clickable
    } else if (displayRating > 0) {
      return displayRating; // User's actual selected/saved rating determines fill amount
    }
    return 0; // <--- CRITICAL CHANGE: If no hover and no user rating, fill amount is 0 (stars are empty)
  };

  const currentVisualFillAmount = getVisualFillAmount();

  const handleClick = (starValue: number) => {
    if (isClickable && onRate) {
      onRate(starValue); // Call parent handler
    }
  };

  // Helper function to render a single star SVG with dynamic fill
  const renderStar = (starValue: number) => {
    // Calculate fill percentage based on currentVisualFillAmount
    let fillPercentage = 0;
    if (currentVisualFillAmount >= starValue) {
      fillPercentage = 100; // Full star
    } else if (currentVisualFillAmount > starValue - 1) {
      fillPercentage = (currentVisualFillAmount - (starValue - 1)) * 100; // Partial star
    }

    // <--- MODIFIED: Determine the fill and stroke colors based on context.
    let fillColor = "var(--color-background-light)"; // Default base fill of the star behind the overlay
    let strokeColor = "var(--color-text-light)"; // Default empty star outline color

    let overlayFillColor = "transparent"; // Color of the filling overlay
    let overlayStrokeColor = "transparent"; // Stroke color of the filling overlay

    // Precedence for OVERLAY color: Hover > User's Rating > Average (if not clickable)
    if (isClickable && hoverRating > 0) {
      // Hover: primary color fill up to hoverRating
      overlayFillColor = "var(--color-primary)";
      overlayStrokeColor = "var(--color-primary)";
      strokeColor = "var(--color-primary)"; // Base outline changes on hover too
    } else if (displayRating > 0) {
      // User's rating: primary color fill
      overlayFillColor = "var(--color-primary)";
      overlayStrokeColor = "var(--color-primary)";
      strokeColor = "var(--color-primary)"; // Base outline
    } else if (!isClickable && averageRating > 0) {
      // NON-CLICKABLE mode, display average: secondary color fill
      overlayFillColor = "var(--color-secondary)";
      overlayStrokeColor = "var(--color-secondary)";
      strokeColor = "var(--color-secondary)"; // Base outline
    }

    // Apply specific stroke for the user's selected star (only if not hovering)
    if (starValue === displayRating && displayRating > 0 && !hoverRating) {
      overlayStrokeColor = "var(--color-accent-blue)"; // Highlight user's chosen star outline
      strokeColor = "var(--color-accent-blue)"; // Also update base stroke for consistency
    }

    return (
      <span
        key={starValue}
        className={`star-wrapper ${isClickable ? "clickable" : ""}`}
        onMouseEnter={isClickable ? () => setHoverRating(starValue) : undefined}
        onMouseLeave={isClickable ? () => setHoverRating(0) : undefined}
        onClick={() => handleClick(starValue)}
      >
        <svg
          className="star-icon-base" // Base star (empty)
          viewBox="0 0 24 24"
          fill={fillColor} // Base star fill color
          stroke={strokeColor} // Base star outline color
          strokeWidth="1.5"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        <svg
          className="star-icon-fill" // Filled star overlay
          viewBox="0 0 24 24"
          fill={overlayFillColor} // Overlay fill color
          stroke={overlayStrokeColor} // Overlay stroke color
          strokeWidth="1.5"
          style={{ width: `${fillPercentage}%` }} // Control fill width
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </span>
    );
  };

  return (
    <div className="star-rating-container">
      <div className="stars">{[1, 2, 3, 4, 5].map(renderStar)}</div>
      <div className="rating-info">
        {totalRatings > 0 ? (
          <>
            <span className="average-text">{averageRating.toFixed(1)} / 5</span>
            <span className="total-ratings-text">
              ({totalRatings} rating{totalRatings !== 1 ? "s" : ""})
            </span>
          </>
        ) : (
          <span className="no-ratings-text">No ratings yet.</span>
        )}
      </div>
    </div>
  );
};

export default StarRating;

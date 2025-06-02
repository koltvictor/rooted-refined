// frontend/src/pages/SingleRecipePage.tsx

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./SingleRecipePage.css";
import StarRating from "../components/StarRating/StarRating";

// Define a type for a single recipe with ingredients (matching backend response)
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

// Define a type for comments
interface Comment {
  id: number;
  user_id: number;
  username: string;
  text: string;
  created_at: string;
  created_at_formatted?: string;
  updated_at: string;
  replies?: Comment[]; // For nested comments
}

interface SingleRecipe {
  id: number;
  title: string;
  description?: string;
  instructions: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  image_url?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: number;
  username?: string;
  ingredients: Ingredient[];
  average_rating: number;
  total_ratings: number;
  current_user_rating: number;
  comments: Comment[]; // Add comments array to the recipe type
}

// --- CommentItem Component Definition (REMAINS THE SAME) ---
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  // Now formatCommentDateTime will be defined within SingleRecipePage
  // and passed down, or you can redefine a local version if you prefer
  // to keep it self-contained in CommentItem, but then handlePostComment
  // needs access to a different format function.

  // Let's make formatCommentDateTime *also* a prop for consistency
  // with the problem solution. This is actually a cleaner way to pass utilities.
  // We'll update the prop definition below.

  // TEMPORARILY: We will remove formatCommentDateTime and formatDate from here,
  // and pass them as props if CommentItem needs them, or define them in SingleRecipePage.
  // For simplicity, let's move formatDate into SingleRecipePage,
  // and CommentItem will receive it as a prop.
  // For the immediate fix, we'll assume `formatDate` is passed down.
  // Let's refine the type for CommentItem.
  return (
    <li key={comment.id} className="single-recipe-comment-item">
      <div className="single-recipe-comment-header">
        {/* We need to use comment.created_at_formatted here */}
        <strong>{comment.username}</strong> -{" "}
        {comment.created_at_formatted ||
          new Date(comment.created_at).toLocaleDateString()}
      </div>
      <p className="single-recipe-comment-text">{comment.text}</p>
      {comment.replies && comment.replies.length > 0 && (
        <ul className="single-recipe-comment-replies">
          {comment.replies.map((reply) => (
            // Ensure key prop is here for replies as well
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </ul>
      )}
    </li>
  );
};

// --- Updated CommentItem type definition for clarity if passing down format function ---
// interface CommentItemProps {
//   comment: Comment;
//   formatDate: (date: Date) => string; // Pass the format function as a prop
// }
// const CommentItem: React.FC<CommentItemProps> = ({ comment, formatDate }) => {
//   return (
//     <li key={comment.id} className="single-recipe-comment-item">
//       <div className="single-recipe-comment-header">
//         <strong>{comment.username}</strong> -{" "}
//         {formatDate(new Date(comment.created_at))} {/* Use the passed format function */}
//       </div>
//       <p className="single-recipe-comment-text">{comment.text}</p>
//       {comment.replies && comment.replies.length > 0 && (
//         <ul className="single-recipe-comment-replies">
//           {comment.replies.map((reply) => (
//             <CommentItem key={reply.id} comment={reply} formatDate={formatDate} /> // Pass it recursively
//           ))}
//         </ul>
//       )}
//     </li>
//   );
// };
// --- END Updated CommentItem type definition ---

const SingleRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<SingleRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const location = useLocation();

  const [avgRating, setAvgRating] = useState(0);
  const [numRatings, setNumRatings] = useState(0);
  const [userCurrentRating, setUserCurrentRating] = useState(0);

  // New state for comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // --- START: Moved formatDate helper function ---
  const formatDate = (date: Date) => {
    if (isNaN(date.getTime())) {
      console.warn("Invalid date object passed to formatDate:", date);
      return "Invalid Date";
    }
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short", // e.g., Jun
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // For AM/PM format
    });
  };

  const formatCommentDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string, attempting to parse:", dateString);
        const parsedDate = new Date(Date.parse(dateString));
        if (isNaN(parsedDate.getTime())) {
          console.error("Could not parse date:", dateString);
          return "Invalid Date";
        }
        return formatDate(parsedDate);
      }
      return formatDate(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };
  // --- END: Moved formatDate helper function ---

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("Recipe ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/recipes/${id}`);
        const recipeData = response.data;

        // Populate comments from the fetched recipe data
        // Ensure comments are formatted before setting state
        const formattedComments = (recipeData.comments || []).map(
          (comment: Comment) => ({
            ...comment,
            created_at_formatted: formatCommentDateTime(comment.created_at), // Use the new function
          })
        );

        setRecipe(recipeData);
        setComments(formattedComments); // Use the formatted comments
        setIsFavorited(
          location.state?.isFavorited || recipeData.isFavorited || false
        );
        setAvgRating(parseFloat(recipeData.average_rating || 0));
        setNumRatings(parseInt(recipeData.total_ratings || 0));
        setUserCurrentRating(parseFloat(recipeData.current_user_rating || 0));
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching recipe:", err);
        if (err.response && err.response.status === 404) {
          setError("Recipe not found.");
        } else {
          setError("Failed to load recipe details. Please try again later.");
        }
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, location.state?.isFavorited]); // Added formatCommentDateTime to dependency array if you redefine it outside of SingleRecipePage

  const canEditDelete =
    recipe && user && (user.id === recipe.user_id || user.is_admin);

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.split("/").pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  };

  const embedVideoSrc = recipe?.video_url
    ? getEmbedUrl(recipe.video_url)
    : null;

  const formatTime = (minutes: number | undefined) => {
    if (minutes === undefined || minutes === null) return "N/A";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let timeString = "";
    if (hours > 0) {
      timeString += `${hours} hr`;
      if (hours > 1) timeString += "s";
    }
    if (remainingMinutes > 0) {
      if (hours > 0) timeString += " ";
      timeString += `${remainingMinutes} min`;
      if (remainingMinutes > 1) timeString += "s";
    }
    if (timeString === "") return "0 mins";
    return timeString;
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Please log in to favorite recipes!");
      return;
    }
    if (!recipe) return;

    try {
      const response = await api.post(`/recipes/${recipe.id}/favorite`);
      setIsFavorited(response.data.favorited);
    } catch (error: any) {
      console.error(
        "Error toggling favorite:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message || "Failed to toggle favorite status."
      );
    }
  };

  const handleRateRecipe = async (rating: number) => {
    if (!user) {
      alert("Please log in to rate recipes!");
      navigate("/login");
      return;
    }
    if (!recipe) return;

    try {
      const response = await api.post(`/recipes/${recipe.id}/rate`, { rating });
      setUserCurrentRating(rating);
      const updatedRecipeResponse = await api.get(`/recipes/${recipe.id}`);

      if (updatedRecipeResponse.data) {
        setAvgRating(
          parseFloat(updatedRecipeResponse.data.average_rating || 0)
        );
        setNumRatings(parseInt(updatedRecipeResponse.data.total_ratings || 0));
      }

      alert(response.data.message);
    } catch (error: any) {
      console.error(
        "Error submitting rating:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          "Failed to submit rating. Please try again."
      );
    }
  };

  // Function to parse instructions and apply bold styling
  const parseInstructions = (instructionsText: string) => {
    // Split the entire instructions string by double newlines first,
    // as that's your general step delimiter.
    // However, for section titles, we'll split by single newlines.
    const lines = instructionsText.split("\n"); // Split by single newlines for initial parsing

    const sections: { title?: string; steps: string[] }[] = [];
    let currentSection: { title?: string; steps: string[] } = { steps: [] }; // Initialize with an empty section

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("*")) {
        // This is a new section title
        // If the currentSection has content, push it to sections array before starting a new one
        if (currentSection.steps.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        // Extract title, removing leading and trailing asterisks
        let title = trimmedLine.substring(1); // Remove leading asterisk
        if (title.endsWith("*")) {
          title = title.substring(0, title.length - 1); // Remove trailing asterisk
        }
        currentSection = { title: title.trim(), steps: [] }; // Start a new section
      } else if (trimmedLine.length > 0) {
        // This is a step, add it to the current section
        currentSection.steps.push(trimmedLine);
      }
      // Ignore empty lines that are not part of a double newline step
    });

    // Push the last collected section if it has content
    if (currentSection.steps.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    return sections.map((section, sectionIndex) => (
      <React.Fragment key={`section-${sectionIndex}`}>
        {section.title && (
          <h3 className="instruction-section-title">{section.title}</h3>
        )}
        {section.steps.length > 0 && (
          <ol className="single-recipe-instructions-list">
            {section.steps.map((step, stepIndex) => (
              <li
                key={`step-${sectionIndex}-${stepIndex}`}
                className="single-recipe-instruction-step"
              >
                {step}
              </li>
            ))}
          </ol>
        )}
      </React.Fragment>
    ));
  };

  const handleShare = () => {
    const shareUrl = window.location.href; // Or construct a specific URL
    const shareText = `Check out this recipe: ${recipe?.title}`;

    if (navigator.share) {
      navigator
        .share({
          title: recipe?.title,
          text: shareText,
          url: shareUrl,
        })
        .then(() => console.log("Shared successfully."))
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      const emailBody = `${shareText}\n\n${shareUrl}`; // Fixed string literal for emailBody
      window.location.href = `mailto:?subject=${encodeURIComponent(
        "Check out this recipe!"
      )}&body=${encodeURIComponent(emailBody)}`;
    }
  };

  // Function to handle posting a new comment
  const handlePostComment = async () => {
    if (!user) {
      alert("Please log in to leave a comment!");
      return;
    }
    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    try {
      //  Replace with your actual API endpoint for posting comments
      const response = await api.post(`/recipes/${recipe?.id}/comments`, {
        text: newComment,
      });

      // Assuming the API returns the newly created comment, which includes 'created_at' and 'username'
      const newCommentData: Comment = response.data.comment; // Backend returns { message, comment }

      // Format the created_at date *before* adding it to the state
      // Use formatCommentDateTime, which includes error handling and specific formatting
      const formattedComment = {
        ...newCommentData,
        created_at_formatted: formatCommentDateTime(newCommentData.created_at),
      };

      // Update the state to include the new comment
      setComments([formattedComment, ...comments]); // Add the new comment to the beginning

      // Clear the input field
      setNewComment("");
    } catch (error: any) {
      console.error("Error posting comment:", error);
      alert(
        error.response?.data?.message ||
          "Failed to post comment. Please try again."
      );
    }
  };

  if (loading) {
    return <div className="single-recipe-container">Loading recipe...</div>;
  }

  if (error) {
    return <div className="single-recipe-container error">Error: {error}</div>;
  }

  if (!recipe) {
    return (
      <div className="single-recipe-container">No recipe data available.</div>
    );
  }

  return (
    <div className="single-recipe-container">
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="single-recipe-image"
        />
      )}
      {embedVideoSrc && (
        <div className="single-recipe-video-container">
          <iframe
            className="single-recipe-video"
            src={embedVideoSrc}
            title={`${recipe.title} Video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>
      )}
      <h1 className="single-recipe-header">{recipe.title}</h1>
      {recipe.username && (
        <p className="single-recipe-author">By: {recipe.username}</p>
      )}
      <div className="recipe-rating-section">
        <StarRating
          averageRating={avgRating}
          totalRatings={numRatings}
          currentUserRating={userCurrentRating}
          isClickable={!!user}
          onRate={handleRateRecipe}
        />
      </div>
      {recipe.description && (
        <p className="single-recipe-description">{recipe.description}</p>
      )}
      <div className="single-recipe-details-grid">
        <p className="single-recipe-detail-item">
          <strong>Prep Time:</strong> {formatTime(recipe.prep_time_minutes)}
        </p>
        <p className="single-recipe-detail-item">
          <strong>Cook Time:</strong> {formatTime(recipe.cook_time_minutes)}
        </p>
        <p className="single-recipe-detail-item">
          <strong>Servings:</strong> {recipe.servings || "N/A"}
        </p>
      </div>
      <div className="single-recipe-section">
        <h2 className="single-recipe-section-header">Ingredients</h2>
        <ul className="single-recipe-ingredient-list">
          {recipe.ingredients.map((ing, index) => (
            <li key={index} className="single-recipe-ingredient-item">
              {ing.quantity} {ing.unit} {ing.name}{" "}
              {ing.notes && `(${ing.notes})`}
            </li>
          ))}
        </ul>
      </div>
      <div className="single-recipe-section">
        <h2 className="single-recipe-section-header">Instructions</h2>
        {parseInstructions(recipe.instructions)}
      </div>

      {/* Action Buttons */}
      <div className="single-recipe-action-buttons">
        {canEditDelete && (
          <button
            onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
            className="single-recipe-action-button single-recipe-edit-button"
          >
            ✏️ Edit Recipe
          </button>
        )}
        <button
          onClick={handleToggleFavorite}
          disabled={!user}
          className={`single-recipe-action-button single-recipe-like-button ${
            isFavorited ? "is-favorited" : ""
          }`}
        >
          {isFavorited ? "❤️ Favorited!" : "🤍 Like"}
        </button>
        <button
          onClick={() => window.print()}
          className="single-recipe-action-button single-recipe-print-button"
        >
          🖨️ Print
        </button>
        <button
          className="single-recipe-action-button single-recipe-share-button"
          onClick={handleShare}
        >
          🔗 Share
        </button>
      </div>
      {/* Comment Section */}
      <div className="single-recipe-section">
        <h2 className="single-recipe-section-header comment-header">
          Comments
        </h2>

        {/* Display existing comments */}
        {comments.length > 0 ? (
          <ul className="single-recipe-comment-list">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        ) : (
          <p>No comments yet.</p>
        )}

        {/* Add new comment input */}
        {user && (
          <div className="single-recipe-add-comment">
            <textarea
              className="single-recipe-comment-input"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={handlePostComment}
              className="single-recipe-action-button single-recipe-comment-button"
            >
              Post Comment
            </button>
          </div>
        )}
      </div>
      <Link to="/recipes" className="single-recipe-back-button">
        ← Back to All Recipes
      </Link>
    </div>
  );
};

export default SingleRecipePage;

// frontend/src/pages/SingleRecipePage.tsx

import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../hooks/useAuth";
import "./SingleRecipePage.css";
import StarRating from "../components/StarRating/StarRating";
import axios from "axios"; // Import axios and AxiosError
import type { BackendErrorResponse } from "../types/index.ts"; // Assuming BackendErrorResponse is in types/index.ts

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
  parent_comment_id?: number | null; // Add this to your interface
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
  comments: Comment[];
}

// --- CommentItem Component Definition ---
// Update CommentItem props to include onReplySubmit and current user info
interface CommentItemProps {
  comment: Comment;
  onReplySubmit: (text: string, parentCommentId: number) => Promise<void>;
  currentUserId: number | null;
  currentUsername: string | null;
  formatCommentDateTime: (dateString: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReplySubmit,
  currentUserId,
  currentUsername,
  formatCommentDateTime,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReplyClick = () => {
    setShowReplyForm(!showReplyForm);
    setReplyText("");
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) {
      alert("Please enter your reply.");
      return;
    }
    try {
      await onReplySubmit(replyText, comment.id);
      setReplyText("");
      setShowReplyForm(false);
    } catch (error: unknown) {
      console.error("Error posting reply:", error);
    }
  };

  return (
    <li key={comment.id} className="single-recipe-comment-item">
      <div className="single-recipe-comment-header">
        <strong>{comment.username}</strong> -{" "}
        {formatCommentDateTime(comment.created_at)}
      </div>
      <p className="single-recipe-comment-text">{comment.text}</p>

      {currentUserId && ( // Only show reply button if user is logged in
        <button
          className="single-recipe-comment-reply-button"
          onClick={handleReplyClick}
        >
          {showReplyForm ? "Cancel Reply" : "Reply"}
        </button>
      )}

      {showReplyForm &&
        currentUserId && ( // Show reply form if toggled and user is logged in
          <div className="single-recipe-add-comment single-recipe-reply-form">
            <textarea
              className="single-recipe-comment-input"
              placeholder={`Replying to ${comment.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button
              onClick={handlePostReply}
              className="single-recipe-action-button single-recipe-comment-button"
            >
              Post Reply
            </button>
          </div>
        )}

      {comment.replies && comment.replies.length > 0 && (
        <ul className="single-recipe-comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReplySubmit={onReplySubmit}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              formatCommentDateTime={formatCommentDateTime} // Pass down formatter
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const addFormattedDatesToCommentTree = (
  commentsArray: Comment[],
  formatDateTime: (dateString: string) => string
): Comment[] => {
  if (!commentsArray) return [];
  return commentsArray.map((comment) => ({
    ...comment,
    created_at_formatted: formatDateTime(comment.created_at),
    replies:
      comment.replies && comment.replies.length > 0
        ? addFormattedDatesToCommentTree(comment.replies, formatDateTime)
        : undefined, // Ensure replies is undefined or an empty array if no replies
  }));
};

const SingleRecipePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // `user` has `userId` and `username`
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

  const formatDate = useCallback(
    (date: Date) => {
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
    },
    [] // Empty dependency array as formatDate has no external dependencies
  );

  const formatCommentDateTime = useCallback(
    (dateString: string) => {
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
    },
    [formatDate]
  );

  // Helper function to build the threaded comment tree on the frontend
  const buildCommentTree = useCallback(
    (commentsList: Comment[], parentId: number | null = null): Comment[] => {
      const tree: Comment[] = [];
      commentsList
        .filter((comment) => comment.parent_comment_id === parentId)
        .forEach((comment) => {
          tree.push({
            ...comment,
            created_at_formatted: formatCommentDateTime(comment.created_at), // Uses formatCommentDateTime
            replies: buildCommentTree(commentsList, comment.id),
          });
        });
      return tree;
    },
    [formatCommentDateTime]
  );

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

        // Backend already provides threaded comments.
        // Just recursively add the formatted date for display on the frontend.
        const commentsWithFormattedDates = addFormattedDatesToCommentTree(
          recipeData.comments || [],
          formatCommentDateTime // Pass the formatCommentDateTime function
        );

        setRecipe(recipeData);
        setComments(commentsWithFormattedDates); // Set the comments directly from the backend's threaded structure
        setIsFavorited(
          location.state?.isFavorited || recipeData.isFavorited || false
        );
        setAvgRating(parseFloat(recipeData.average_rating || 0));
        setNumRatings(parseInt(recipeData.total_ratings || 0));
        setUserCurrentRating(parseFloat(recipeData.current_user_rating || 0));
        setLoading(false);
      } catch (err: unknown) {
        // Changed from 'any'
        if (axios.isAxiosError<BackendErrorResponse>(err)) {
          console.error("Error fetching recipe:", err);
          if (err.response && err.response.status === 404) {
            setError("Recipe not found.");
          } else {
            setError(
              err.response?.data?.message ||
                "Failed to load recipe details. Please try again later."
            );
          }
        } else if (err instanceof Error) {
          console.error("Error fetching recipe:", err.message);
          setError(
            err.message ||
              "Failed to load recipe details. Please try again later."
          );
        } else {
          console.error("An unknown error occurred fetching recipe:", err);
          setError(`An unknown error occurred: ${String(err)}`);
        }
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, location.state?.isFavorited, formatCommentDateTime]);

  const canEditDelete =
    recipe && user && (user.id === recipe.user_id || user.is_admin);

  const getEmbedUrl = (url: string) => {
    // YouTube standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // YouTube short URL: https://youtu.be/VIDEO_ID
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // Vimeo URL: https://vimeo.com/VIDEO_ID
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("/").pop(); // Gets the last part of the URL, usually the ID
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
    } catch (error: unknown) {
      // Changed from 'any'
      if (axios.isAxiosError<BackendErrorResponse>(error)) {
        console.error(
          "Error toggling favorite:",
          error.response?.data || error.message
        );
        alert(
          error.response?.data?.message || "Failed to toggle favorite status."
        );
      } else if (error instanceof Error) {
        console.error("Error toggling favorite:", error.message);
        alert(error.message || "Failed to toggle favorite status.");
      } else {
        console.error("An unknown error occurred toggling favorite:", error);
        alert(`An unknown error occurred: ${String(error)}`);
      }
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
    } catch (error: unknown) {
      // Changed from 'any'
      if (axios.isAxiosError<BackendErrorResponse>(error)) {
        console.error(
          "Error submitting rating:",
          error.response?.data || error.message
        );
        alert(
          error.response?.data?.message ||
            "Failed to submit rating. Please try again."
        );
      } else if (error instanceof Error) {
        console.error("Error submitting rating:", error.message);
        alert(error.message || "Failed to submit rating. Please try again.");
      } else {
        console.error("An unknown error occurred submitting rating:", error);
        alert(`An unknown error occurred: ${String(error)}`);
      }
    }
  };

  // Function to parse instructions and apply bold styling
  const parseInstructions = (instructionsText: string) => {
    const lines = instructionsText.split("\n");

    const sections: { title?: string; steps: string[] }[] = [];
    let currentSection: { title?: string; steps: string[] } = { steps: [] };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("*")) {
        if (currentSection.steps.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        let title = trimmedLine.substring(1);
        if (title.endsWith("*")) {
          title = title.substring(0, title.length - 1);
        }
        currentSection = { title: title.trim(), steps: [] };
      } else if (trimmedLine.length > 0) {
        currentSection.steps.push(trimmedLine);
      }
    });

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
    const shareUrl = window.location.href;
    const shareText = `Check out this recipe: ${recipe?.title}`;

    if (navigator.share) {
      navigator
        .share({
          title: recipe?.title,
          text: shareText,
          url: shareUrl,
        })
        .then(() => console.log("Shared successfully."))
        .catch((error: unknown) => {
          // Changed from 'any'
          console.log("Error sharing", error);
          // You could add a more user-friendly message here if desired
        });
    } else {
      const emailBody = `${shareText}\n\n${shareUrl}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(
        "Check out this recipe!"
      )}&body=${encodeURIComponent(emailBody)}`;
    }
  };

  // Function to handle posting a new comment or reply
  // Now accepts an optional parentCommentId
  const handlePostComment = async (
    text: string,
    parentCommentId: number | null = null
  ) => {
    if (!user) {
      alert("Please log in to leave a comment!");
      return;
    }
    if (!text.trim()) {
      alert("Please enter a comment.");
      return;
    }
    if (!recipe) return; // Ensure recipe is loaded

    try {
      const payload = {
        text: text,
        parent_comment_id: parentCommentId,
      };

      const response = await api.post(
        `/recipes/${recipe.id}/comments`,
        payload
      );

      const newCommentData: Comment = response.data.comment;
      console.log("New comment data from backend:", newCommentData);

      // Add username from frontend user state if not provided by backend (good fallback)
      if (!newCommentData.username && user?.username) {
        newCommentData.username = user.username;
      }

      // Format the created_at date immediately for display
      const formattedComment = {
        ...newCommentData,
        created_at_formatted: formatCommentDateTime(newCommentData.created_at),
        replies: [], // New comments/replies start with no replies
      };

      // Function to recursively insert a new comment/reply into the tree
      const insertCommentIntoTree = (
        commentsArray: Comment[],
        newCmt: Comment
      ): Comment[] => {
        if (newCmt.parent_comment_id === null) {
          // It's a top-level comment, add to the beginning
          return [newCmt, ...commentsArray];
        } else {
          // It's a reply, find its parent and insert
          return commentsArray.map((cmt) => {
            if (cmt.id === newCmt.parent_comment_id) {
              // If this is the parent, create a NEW object for parent
              // and ensure its replies array is also a NEW array reference
              return {
                ...cmt,
                replies: cmt.replies
                  ? [...cmt.replies, newCmt] // Create new array reference for replies
                  : [newCmt], // If no replies array, create one
              };
            } else if (cmt.replies && cmt.replies.length > 0) {
              // Recursively check children. Ensure a NEW object for cmt
              // if any of its children are modified.
              const updatedReplies = insertCommentIntoTree(cmt.replies, newCmt);
              if (updatedReplies !== cmt.replies) {
                // Only update if children were modified
                return {
                  ...cmt,
                  replies: updatedReplies,
                };
              }
            }
            return cmt; // Return original comment if no change occurred in this branch
          });
        }
      };

      setComments((prevComments) =>
        insertCommentIntoTree(prevComments, formattedComment)
      );

      // Clear the appropriate input field
      if (parentCommentId === null) {
        setNewComment(""); // Clear main comment input
      }
      // For replies, the CommentItem component will clear its own input
    } catch (error: unknown) {
      // Changed from 'any'
      if (axios.isAxiosError<BackendErrorResponse>(error)) {
        console.error("Error posting comment:", error);
        alert(
          error.response?.data?.message ||
            "Failed to post comment. Please try again."
        );
      } else if (error instanceof Error) {
        console.error("Error posting comment:", error.message);
        alert(error.message || "Failed to post comment. Please try again.");
      } else {
        console.error("An unknown error occurred posting comment:", error);
        alert(`An unknown error occurred: ${String(error)}`);
      }
      throw error; // Re-throw to allow CommentItem to handle error if needed
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
              <CommentItem
                key={comment.id}
                comment={comment}
                onReplySubmit={handlePostComment} // Pass the handler
                currentUserId={user ? user.id : null} // Pass current user ID
                currentUsername={user ? user.username : null} // Pass current username
                formatCommentDateTime={formatCommentDateTime} // Pass down formatter
              />
            ))}
          </ul>
        ) : (
          <p>No comments yet.</p>
        )}

        {/* Main Add new comment input */}
        {user && (
          <div className="single-recipe-add-comment">
            <textarea
              className="single-recipe-comment-input"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={() => handlePostComment(newComment, null)} // Call with null for top-level comment
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

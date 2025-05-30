// frontend/src/pages/UserProfilePage.tsx

import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import api from "../api/api"; // Updated path if needed after previous step
import { useNavigate } from "react-router-dom";
import "./UserProfilePage.css";
import { useAuth } from "../context/AuthContext"; // Updated path if needed

// Import all necessary types from the centralized types file
import type {
  FilterOption, // Keep this if you need to specifically type a variable as FilterOption within the component
  UserProfile,
  FilterOptionsResponse,
} from "../types/index";

// Removed these interfaces as they are now in types/index.ts:
/*
interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  dietary_restrictions: FilterOption[]; // Array of {id, name}
}

interface FilterOption {
  id: number;
  name: string;
}

interface FilterOptionsResponse {
  dietaryRestrictions: FilterOption[]; // Only need dietary restrictions from this
  // Add other filter types here if you want to display/edit them on the profile
}
*/

const getFullImageUrl = (
  relativePath: string | null | undefined
): string | null => {
  if (!relativePath) return null;
  const backendBaseUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  return `${backendBaseUrl}${relativePath}`;
};

const UserProfilePage: React.FC = () => {
  const { user: authUser, refreshUserProfile } = useAuth(); // Destructure refreshUserProfile
  const [profile, setProfile] = useState<UserProfile | null>(null); // Use imported UserProfile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({}); // Use imported UserProfile
  const [availableDietaryRestrictions, setAvailableDietaryRestrictions] =
    useState<FilterOption[]>([]); // Use imported FilterOption
  const [selectedDietaryRestrictionIds, setSelectedDietaryRestrictionIds] =
    useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<
    string | null
  >(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordOverlay, setShowPasswordOverlay] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [clearProfilePicture, setClearProfilePicture] = useState(false);

  const navigate = useNavigate();

  // Effect to fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<UserProfile>("/users/profile"); // Use imported UserProfile
        setProfile(response.data);
        setFormData(response.data);
        setSelectedDietaryRestrictionIds(
          response.data.dietary_restrictions.map((dr) => dr.id)
        );
        setProfilePicturePreview(
          getFullImageUrl(response.data.profile_picture_url)
        );
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.response?.data?.message || "Failed to load profile.");
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableDietaryRestrictions = async () => {
      try {
        const response = await api.get<FilterOptionsResponse>("/data/filters"); // Use imported FilterOptionsResponse
        setAvailableDietaryRestrictions(
          response.data.dietaryRestrictions || []
        );
      } catch (err: any) {
        console.error("Error fetching available dietary restrictions:", err);
      }
    };

    fetchUserProfile();
    fetchAvailableDietaryRestrictions();
  }, [navigate, authUser]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setClearProfilePicture(false);
    } else {
      setSelectedFile(null);
      setProfilePicturePreview(
        profile ? getFullImageUrl(profile.profile_picture_url) : null
      );
    }
  };

  const handleClearProfilePicture = () => {
    setSelectedFile(null);
    setProfilePicturePreview(null);
    setClearProfilePicture(true);
  };

  const handleDietaryRestrictionChange = (id: number, isChecked: boolean) => {
    setSelectedDietaryRestrictionIds((prev) =>
      isChecked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username || "");
    formDataToSend.append("email", formData.email || "");
    formDataToSend.append("first_name", formData.first_name || "");
    formDataToSend.append("last_name", formData.last_name || "");
    formDataToSend.append("bio", formData.bio || "");

    if (selectedFile) {
      formDataToSend.append("profile_picture", selectedFile);
    }
    if (clearProfilePicture) {
      formDataToSend.append("clear_profile_picture", "true");
    }

    formDataToSend.append(
      "dietary_restrictions",
      JSON.stringify(selectedDietaryRestrictionIds)
    );

    try {
      await api.put("/users/profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);

      if (refreshUserProfile) {
        await refreshUserProfile();
      } else {
        console.warn("refreshUserProfile is not available in AuthContext.");
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      if (err.response?.data?.message) {
        if (err.response.data.message.includes("File size too large")) {
          setError("File size too large. Max 5MB.");
        } else if (err.response.data.message.includes("Invalid file type")) {
          setError(
            "Invalid file type. Only images (PNG, JPEG, GIF) are allowed."
          );
        } else {
          setError(err.response.data.message || "Failed to save profile.");
        }
      } else {
        setError("Failed to save profile. Please try again.");
      }
      setSaveMessage(null);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordChangeMessage(null);
    setPasswordChangeError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New password and confirmation do not match.");
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeError(
        "New password must be at least 8 characters long."
      );
      setIsChangingPassword(false);
      return;
    }

    try {
      await api.put("/users/profile/password", {
        currentPassword,
        newPassword,
      });
      setPasswordChangeMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error("Error changing password:", err);
      setPasswordChangeError(
        err.response?.data?.message || "Failed to change password."
      );
    } finally {
      setIsChangingPassword(false);
      setTimeout(() => {
        setPasswordChangeMessage(null);
        setPasswordChangeError(null);
      }, 5000);
    }
  };

  if (loading) {
    return <div className="user-profile-container">Loading profile...</div>;
  }

  if (error && !profile) {
    return <div className="user-profile-container error-message">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="user-profile-container">No profile data available.</div>
    );
  }

  return (
    <div className="user-profile-container">
      <h1 className="profile-header">{profile?.username}'s Profile</h1>
      {saveMessage && <div className="success-message">{saveMessage}</div>}
      {error && isEditing && <div className="error-message">{error}</div>}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="form-group profile-picture-upload-group">
            <h3>Profile Picture</h3>
            <div className="profile-picture-preview-container">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile Preview"
                  className="profile-picture-preview"
                />
              ) : (
                <div className="profile-picture-placeholder large-placeholder">
                  No Image Selected
                </div>
              )}
            </div>
            <label className="form-label file-upload-label">
              Upload New Picture:
              <input
                type="file"
                name="profile_picture"
                accept="image/*"
                onChange={handleFileChange}
                className="form-input file-input"
              />
            </label>
            {(profile?.profile_picture_url || selectedFile) && (
              <button
                type="button"
                onClick={handleClearProfilePicture}
                className="clear-profile-picture-button"
              >
                Clear Current Picture
              </button>
            )}
          </div>

          <label className="form-label">
            Username:
            <input
              type="text"
              name="username"
              value={formData.username || ""}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </label>
          <label className="form-label">
            Email:
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </label>
          <label className="form-label">
            First Name:
            <input
              type="text"
              name="first_name"
              value={formData.first_name || ""}
              onChange={handleInputChange}
              className="form-input"
            />
          </label>
          <label className="form-label">
            Last Name:
            <input
              type="text"
              name="last_name"
              value={formData.last_name || ""}
              onChange={handleInputChange}
              className="form-input"
            />
          </label>
          <label className="form-label">
            Bio:
            <textarea
              name="bio"
              value={formData.bio || ""}
              onChange={handleInputChange}
              rows={4}
              className="form-textarea"
            />
          </label>
          <div className="form-group">
            <h3>Dietary Restrictions:</h3>
            <div className="dietary-restrictions-grid">
              {availableDietaryRestrictions.map((option) => (
                <label key={option.id} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={selectedDietaryRestrictionIds.includes(option.id)}
                    onChange={(e) =>
                      handleDietaryRestrictionChange(
                        option.id,
                        e.target.checked
                      )
                    }
                  />
                  {option.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Ensure profile is not null before using it
                if (profile) {
                  setFormData(profile);
                  setSelectedDietaryRestrictionIds(
                    profile.dietary_restrictions.map((dr) => dr.id)
                  );
                  setProfilePicturePreview(
                    getFullImageUrl(profile.profile_picture_url)
                  );
                }
                setSaveMessage(null);
                setError(null);
                setSelectedFile(null);
                setClearProfilePicture(false);
              }}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details-view">
          <div className="profile-card">
            {profile.profile_picture_url ? (
              <img
                src={getFullImageUrl(profile.profile_picture_url) || ""}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">No Image</div>
            )}
            <h2 className="profile-username">{profile.username}</h2>
            {profile.first_name || profile.last_name ? (
              <p className="profile-name">
                {profile.first_name} {profile.last_name}
              </p>
            ) : null}
            <p className="profile-email">{profile.email}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            {profile.dietary_restrictions.length > 0 && (
              <div className="profile-section">
                <h3>My Dietary Restrictions:</h3>
                <ul className="profile-tags-list">
                  {profile.dietary_restrictions.map((dr) => (
                    <li key={dr.id} className="profile-tag">
                      {dr.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="edit-profile-button"
            >
              Edit Profile
            </button>

            <button
              onClick={() => setShowPasswordOverlay(true)}
              className="update-password-button"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
      {showPasswordOverlay && (
        <div className="password-overlay-backdrop">
          <div className="password-overlay-content">
            <div className="password-overlay-header">
              <h2>Update Password</h2>
              <button
                className="close-password-overlay-button"
                onClick={() => {
                  setShowPasswordOverlay(false);
                  setPasswordChangeError(null);
                  setPasswordChangeMessage(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleChangePassword}
              className="password-change-form"
            >
              {passwordChangeMessage && (
                <div className="success-message">{passwordChangeMessage}</div>
              )}
              {passwordChangeError && (
                <div className="error-message">{passwordChangeError}</div>
              )}
              <label className="form-label">
                Current Password:
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </label>
              <label className="form-label">
                New Password:
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </label>
              <label className="form-label">
                Confirm New Password:
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </label>
              <div className="form-actions password-overlay-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordOverlay(false);
                    setPasswordChangeError(null);
                    setPasswordChangeMessage(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;

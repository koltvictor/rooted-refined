// frontend/src/pages/UserProfilePage.tsx

import React, { useState, useEffect, FormEvent } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import "./UserProfilePage.css"; // We will create this CSS file next

// Define interfaces for data structures
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

const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({}); // For editable form data
  const [availableDietaryRestrictions, setAvailableDietaryRestrictions] =
    useState<FilterOption[]>([]);
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

  const navigate = useNavigate(); // Initialize useNavigate hook

  // Effect to fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<UserProfile>("/users/profile");
        setProfile(response.data);
        setFormData(response.data); // Initialize form data with fetched profile
        setSelectedDietaryRestrictionIds(
          response.data.dietary_restrictions.map((dr) => dr.id)
        );
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.response?.data?.message || "Failed to load profile.");
        // If 401/403, redirect to login
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableDietaryRestrictions = async () => {
      try {
        const response = await api.get<FilterOptionsResponse>("/data/filters");
        setAvailableDietaryRestrictions(
          response.data.dietaryRestrictions || []
        );
      } catch (err: any) {
        console.error("Error fetching available dietary restrictions:", err);
        // Don't block profile load if this fails, but set error
      }
    };

    fetchUserProfile();
    fetchAvailableDietaryRestrictions();
  }, [navigate]); // Add navigate to dependency array

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

    try {
      // Prepare data for backend: only send IDs for dietary restrictions
      const dataToUpdate = {
        ...formData,
        dietary_restrictions: selectedDietaryRestrictionIds,
      };

      await api.put("/users/profile", dataToUpdate);
      setSaveMessage("Profile updated successfully!");
      setIsEditing(false); // Exit editing mode on successful save
      // Re-fetch profile to ensure UI is in sync (or manually update state)
      // For simplicity, re-fetch for now:
      const response = await api.get<UserProfile>("/users/profile");
      setProfile(response.data);
      setFormData(response.data);
      setSelectedDietaryRestrictionIds(
        response.data.dietary_restrictions.map((dr) => dr.id)
      );
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.response?.data?.message || "Failed to save profile.");
      setSaveMessage(null);
    } finally {
      setIsSaving(false);
      // Clear save message after a few seconds
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

    // Basic password strength check (optional, but good practice)
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
      // Clear password fields on success
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
        // Clear messages after a few seconds
        setPasswordChangeMessage(null);
        setPasswordChangeError(null);
      }, 5000);
    }
  };

  if (loading) {
    return <div className="user-profile-container">Loading profile...</div>;
  }

  if (error && !profile) {
    // Only show full error if profile couldn't load at all
    return <div className="user-profile-container error-message">{error}</div>;
  }

  if (!profile) {
    // This case should ideally not be reached if loading/error handling is robust
    return (
      <div className="user-profile-container">No profile data available.</div>
    );
  }

  return (
    <div className="user-profile-container">
      <h1 className="profile-header">My Profile</h1>
      {saveMessage && <div className="success-message">{saveMessage}</div>}
      {error && isEditing && <div className="error-message">{error}</div>}{" "}
      {/* Show error if saving fails */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="profile-form">
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
          <label className="form-label">
            Profile Picture URL:
            <input
              type="text"
              name="profile_picture_url"
              value={formData.profile_picture_url || ""}
              onChange={handleInputChange}
              className="form-input"
            />
          </label>

          {/* Dietary Restrictions Selector */}
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
                setFormData(profile); // Reset form data if canceling
                setSelectedDietaryRestrictionIds(
                  profile.dietary_restrictions.map((dr) => dr.id)
                ); // Reset selected D.R.
                setSaveMessage(null); // Clear any messages
                setError(null); // Clear any errors
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
                src={profile.profile_picture_url}
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

            {/* NEW: Button to open password change overlay */}
            <button
              onClick={() => setShowPasswordOverlay(true)}
              className="update-password-button"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
      {/* NEW: Password Change Overlay */}
      {showPasswordOverlay && (
        <div className="password-overlay-backdrop">
          <div className="password-overlay-content">
            <div className="password-overlay-header">
              <h2>Update Password</h2>
              <button
                className="close-password-overlay-button"
                onClick={() => {
                  setShowPasswordOverlay(false);
                  setPasswordChangeError(null); // Clear errors when closing
                  setPasswordChangeMessage(null); // Clear messages when closing
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
                {" "}
                {/* Use specific class for overlay buttons */}
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
                    setPasswordChangeError(null); // Clear errors when closing
                    setPasswordChangeMessage(null); // Clear messages when closing
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

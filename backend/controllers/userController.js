// backend/controllers/userController.js
const bcrypt = require("bcryptjs");
const knex = require("knex")(require("../knexfile").development);
const fs = require("fs").promises;
const path = require("path");

/**
 * @desc Get authenticated user's profile
 * @route GET /api/users/profile
 * @access Private
 * @param {object} req - The request object, should contain req.user from auth middleware.
 * @param {object} res - The response object.
 */
exports.getUserProfile = async (req, res) => {
  try {
    // req.user is populated by the authentication middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Not authorized, no user ID." });
    }

    const userId = req.user.userId;

    // Fetch user details from the 'users' table
    // Select only safe fields to send to the frontend
    const user = await knex("users")
      .select(
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "bio",
        "profile_picture_url",
        "is_admin"
      ) // Add any other profile fields you have or plan to add
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // You might want to fetch associated preferences here too
    // For example, if you have user_dietary_restrictions table
    const userDietaryRestrictions = await knex("user_dietary_restrictions")
      .select("dietary_restriction_id")
      .where({ user_id: userId });
    const dietaryRestrictionIds = userDietaryRestrictions.map(
      (dr) => dr.dietary_restriction_id
    );

    // Fetch the names of these restrictions for display
    const detailedDietaryRestrictions = await knex("dietary_restrictions")
      .select("id", "name")
      .whereIn("id", dietaryRestrictionIds);

    res.status(200).json({
      ...user,
      dietary_restrictions: detailedDietaryRestrictions, // Send array of objects {id, name}
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error fetching user profile." });
  }
};

/**
 * @desc Update authenticated user's profile
 * @route PUT /api/users/profile
 * @access Private
 * @param {object} req - The request object (body: { username, email, ... }, req.user from auth middleware).
 * @param {object} res - The response object.
 */
exports.updateUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      // If a file was uploaded, clean it up if auth fails
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      return res.status(401).json({ message: "Not authorized." });
    }

    const userId = req.user.userId;
    const { username, email, first_name, last_name, bio } = req.body;
    let profile_picture_url = req.body.profile_picture_url; // Existing URL or placeholder from form

    let dietary_restrictions;
    if (req.body.dietary_restrictions) {
      try {
        dietary_restrictions = JSON.parse(req.body.dietary_restrictions);
        // Ensure it's an array after parsing, default to empty array if not
        if (!Array.isArray(dietary_restrictions)) {
          dietary_restrictions = [];
        }
      } catch (parseError) {
        console.error("Error parsing dietary_restrictions:", parseError);
        // If parsing fails, treat it as empty or invalid data
        dietary_restrictions = [];
      }
    } else {
      dietary_restrictions = []; // If the field wasn't sent at all
    }

    // If a new file was uploaded, use its path
    if (req.file) {
      profile_picture_url = `/uploads/profiles/${req.file.filename}`; // Path to serve from Express static
    } else if (req.body.clear_profile_picture === "true") {
      // Check if user wants to clear existing photo
      profile_picture_url = null;
    }

    // Basic validation
    if (!username || !email) {
      return res
        .status(400)
        .json({ message: "Username and email are required." });
    }

    // Check if username or email already exists for another user
    const existingUserWithUsername = await knex("users")
      .where({ username })
      .whereNot({ id: userId })
      .first();
    if (existingUserWithUsername) {
      return res.status(400).json({ message: "Username already taken." });
    }
    const existingUserWithEmail = await knex("users")
      .where({ email })
      .whereNot({ id: userId })
      .first();
    if (existingUserWithEmail) {
      return res.status(400).json({ message: "Email already in use." });
    }

    await knex.transaction(async (trx) => {
      const oldUserProfile = await trx("users")
        .select("profile_picture_url")
        .where({ id: userId })
        .first();
      const oldProfilePicturePath = oldUserProfile
        ? oldUserProfile.profile_picture_url
        : null;

      // Update basic user details
      const updatedRows = await trx("users")
        .where({ id: userId })
        .update({
          username,
          email,
          first_name: first_name || null,
          last_name: last_name || null,
          bio: bio || null,
          profile_picture_url: profile_picture_url, // Use the determined URL/path
          updated_at: knex.fn.now(),
        });

      if (updatedRows === 0) {
        return res
          .status(404)
          .json({ message: "User not found or no changes made." });
      }

      if (
        req.file &&
        oldProfilePicturePath &&
        oldProfilePicturePath.startsWith("/uploads/")
      ) {
        const fullOldPath = path.join(__dirname, "..", oldProfilePicturePath);
        // Ensure we don't accidentally delete critical system files
        if (
          fullOldPath.startsWith(path.join(__dirname, "../uploads/profiles"))
        ) {
          try {
            await fs.unlink(fullOldPath);
            console.log(`Deleted old profile picture: ${fullOldPath}`);
          } catch (deleteError) {
            console.warn(
              `Could not delete old profile picture ${fullOldPath}:`,
              deleteError.message
            );
          }
        }
      } else if (
        profile_picture_url === null &&
        oldProfilePicturePath &&
        oldProfilePicturePath.startsWith("/uploads/")
      ) {
        // User explicitly cleared photo
        const fullOldPath = path.join(__dirname, "..", oldProfilePicturePath);
        if (
          fullOldPath.startsWith(path.join(__dirname, "../uploads/profiles"))
        ) {
          try {
            await fs.unlink(fullOldPath);
            console.log(
              `Cleared and deleted old profile picture: ${fullOldPath}`
            );
          } catch (deleteError) {
            console.warn(
              `Could not delete old profile picture ${fullOldPath} after clear request:`,
              deleteError.message
            );
          }
        }
      }

      // Handle dietary restrictions (clear existing and re-insert if provided)
      await trx("user_dietary_restrictions").where({ user_id: userId }).del(); // Clear existing
      if (dietary_restrictions.length > 0) {
        const entries = dietary_restrictions.map((drId) => ({
          user_id: userId,
          dietary_restriction_id: drId,
        }));
        await trx("user_dietary_restrictions").insert(entries);
      }

      res.status(200).json({
        message: "Profile updated successfully!",
        profile_picture_url: profile_picture_url,
      });
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    // If multer passes an error (e.g., file size limit exceeded)
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "File size too large. Max 5MB." });
    } else if (error.message === "Only image files are allowed!") {
      res
        .status(400)
        .json({ message: "Invalid file type. Only images are allowed." });
    } else {
      // If a file was uploaded, clean it up on any other error
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      res.status(500).json({
        message: "Server error updating user profile.",
        error: error.message,
      });
    }
  }
};

/**
 * @desc Change authenticated user's password
 * @route PUT /api/users/profile/password
 * @access Private
 * @param {object} req - The request object (body: { currentPassword, newPassword }, req.user).
 * @param {object} res - The response object.
 */
exports.changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required." });
    }

    // Fetch the user's current hashed password from the database
    const user = await knex("users")
      .select("password_hash")
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("Current password from client (plain text):", currentPassword);
    console.log("User object from DB:", user);
    console.log("User password from DB (should be string):", user.password);
    console.log("Type of user.password:", typeof user.password);

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in the database
    // --- CHANGE HERE: update "password_hash" instead of "password" ---
    await knex("users").where({ id: userId }).update({
      password_hash: hashedNewPassword,
      updated_at: knex.fn.now(),
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error changing password." });
  }
};

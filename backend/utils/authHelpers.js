// backend/utils/authHelpers.js

/**
 * Checks if the requesting user is the owner of a resource or an admin.
 * @param {object} req - The Express request object.
 * @param {object} resource - The resource object (e.g., recipe) that has a user_id.
 * @returns {boolean} True if the user is the owner or an admin, false otherwise.
 */
const isOwnerOrAdmin = (req, resource) => {
  return (
    req.user && (req.user.userId === resource.user_id || req.user.is_admin)
  );
};

module.exports = {
  isOwnerOrAdmin,
};

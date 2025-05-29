// backend/utils/paramParsers.js

/**
 * Parses a comma-separated string of IDs into an array of numbers.
 * Filters out non-numeric values and IDs less than or equal to 0.
 * @param {string | undefined} idString - The comma-separated string of IDs.
 * @returns {Array<number>} An array of valid numerical IDs.
 */
const parseIds = (idString) => {
  return idString
    ? String(idString) // Ensure it's a string, handles cases where it might be a number
        .split(",")
        .map(Number)
        .filter((id) => !isNaN(id) && id > 0)
    : [];
};

module.exports = {
  parseIds,
};

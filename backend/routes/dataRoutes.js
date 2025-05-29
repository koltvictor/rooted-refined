// backend/routes/dataRoutes.js

const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");

// Public route to fetch all filter options (categories, cuisines, etc.)
router.get("/filters", dataController.getAllFilterOptions);

module.exports = router;

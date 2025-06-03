// backend/routes/contactRoutes.js

const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// Define the route for submitting contact form messages
// This route does not require authentication
router.post("/", contactController.submitMessage);

module.exports = router;

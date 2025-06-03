// backend/routes/resourceRoutes.js

const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");

// Route to get all resources (publicly accessible)
router.get("/", resourceController.getAllResources);

// Optional: Admin routes for managing resources
// const { protect, authorize } = require('../middleware/authMiddleware');
// router.post('/', protect, authorize(['admin']), resourceController.createResource);
// router.put('/:id', protect, authorize(['admin']), resourceController.updateResource);
// router.delete('/:id', protect, authorize(['admin']), resourceController.deleteResource);

module.exports = router;

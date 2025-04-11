const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get all properties from S3 (public route, no auth required)
router.get('/', propertyController.getProperties);

// Get a single property by ID
router.get('/:id', propertyController.getPropertyById);

// Upload a new property with images to S3 (requires authentication)
router.post(
  '/upload',
  authenticate,
  propertyController.uploadMiddleware,
  propertyController.uploadProperty
);

// Update an existing property (requires authentication)
router.put(
  '/:id',
  authenticate,
  propertyController.uploadMiddleware,
  propertyController.updateProperty
);

// Delete a property and its images (requires authentication)
router.delete(
  '/:id',
  authenticate,
  propertyController.deleteProperty
);

module.exports = router; 
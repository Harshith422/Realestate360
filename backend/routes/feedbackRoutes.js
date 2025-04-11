const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Store feedback (public endpoint)
router.post('/', feedbackController.storeFeedback);

// Get all feedback (admin only)
router.get('/', authenticateToken, isAdmin, feedbackController.getFeedback);

module.exports = router; 
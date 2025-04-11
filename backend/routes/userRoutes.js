const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// GET user profile information
router.get('/profile', userController.getUserProfile);

// GET user profile by email (for appointments)
router.get('/profile/:email', userController.getUserProfileByEmail);

// POST update user profile
router.post('/profile', userController.uploadProfileImage, userController.updateUserProfile);

module.exports = router; 
const express = require('express');
const router = express.Router();
const userStatsController = require('../controllers/userStatsController');
const { auth } = require('../middleware/auth');

// Public routes (for demonstration, might want to make protected in production)
router.get('/active', userStatsController.getMostActiveUsers);

// Protected routes
router.get('/stats', auth, userStatsController.getUserActivityStats);

module.exports = router;
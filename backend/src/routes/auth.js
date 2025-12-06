const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.post('/emails', auth, authController.addEmail);
router.put('/emails/:email_id/verify', auth, authController.verifyEmail);
router.put('/phone/verify', auth, authController.verifyPhone);

module.exports = router;
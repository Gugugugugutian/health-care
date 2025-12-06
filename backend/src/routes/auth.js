const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/emails', auth, authController.addEmail);
router.delete('/emails/:email_id', auth, authController.deleteEmail);
router.put('/emails/:email_id/verify', auth, authController.verifyEmail);
router.put('/phone', auth, authController.updatePhoneNumber);
router.put('/phone/verify', auth, authController.verifyPhone);

module.exports = router;
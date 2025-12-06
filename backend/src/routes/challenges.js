const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/active', challengeController.getActiveChallenges);
router.get('/search', challengeController.searchChallenges);

// Protected routes
router.post('/', auth, challengeController.createChallenge);
router.get('/', auth, challengeController.getUserChallenges);
router.get('/stats', auth, challengeController.getChallengeStats);
router.get('/:id', auth, challengeController.getChallengeById);
router.post('/:id/join', auth, challengeController.joinChallenge);
router.put('/:id/progress', auth, challengeController.updateProgress);
router.post('/:id/invite', auth, challengeController.inviteToChallenge);
router.delete('/:id', auth, challengeController.deleteChallenge);
router.delete('/:id/leave', auth, challengeController.leaveChallenge);

module.exports = router;
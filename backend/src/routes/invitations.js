const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const { auth } = require('../middleware/auth');

// Protected routes
router.get('/', auth, invitationController.getSentInvitations);
router.get('/mine', auth, invitationController.getMyInvitations);
router.get('/stats', auth, invitationController.getInvitationStats);
router.post('/', auth, invitationController.createInvitation);
router.get('/:uid', auth, invitationController.getInvitationByUid);
router.put('/:uid/accept', auth, invitationController.acceptInvitation);
router.delete('/:id', auth, invitationController.cancelInvitation);

module.exports = router;
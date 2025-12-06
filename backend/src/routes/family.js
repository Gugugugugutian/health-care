const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { auth } = require('../middleware/auth');

// Protected routes
router.post('/', auth, familyController.createFamilyGroup);
router.get('/', auth, familyController.getUserFamilyGroups);
router.get('/stats', auth, familyController.getFamilyStats);
router.get('/:id', auth, familyController.getFamilyGroupById);
router.post('/:id/members', auth, familyController.addMember);
router.delete('/:id/members/:user_id', auth, familyController.removeMember);
router.put('/:id/members/:user_id', auth, familyController.updateMember);
router.post('/:id/invite', auth, familyController.inviteToFamily);
router.delete('/:id', auth, familyController.deleteFamilyGroup);

module.exports = router;
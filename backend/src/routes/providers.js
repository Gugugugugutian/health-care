const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', providerController.getAllProviders);
router.get('/search', providerController.searchProviders);
router.get('/:id', providerController.getProviderById);

// Protected routes
router.post('/', auth, providerController.createProvider);
router.put('/:id/verify', auth, providerController.verifyProvider);
router.post('/link', auth, providerController.linkProvider);
router.delete('/unlink/:provider_id', auth, providerController.unlinkProvider);
router.get('/user/mine', auth, providerController.getUserProviders);
router.get('/user/primary', auth, providerController.getPrimaryProvider);

module.exports = router;
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { auth } = require('../middleware/auth');

// Protected routes
router.post('/', auth, appointmentController.createAppointment);
router.get('/', auth, appointmentController.getUserAppointments);
router.get('/stats', auth, appointmentController.getAppointmentStats);
router.get('/search/date', auth, appointmentController.searchAppointmentsByDate);
router.get('/search', auth, appointmentController.searchAppointments);
router.get('/:id', auth, appointmentController.getAppointmentById);
router.put('/:id/cancel', auth, appointmentController.cancelAppointment);
router.get('/provider/:provider_id', auth, appointmentController.getProviderAppointments);

module.exports = router;
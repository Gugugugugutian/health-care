const Appointment = require('../models/Appointment');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { validateDate, validateTime, validateConsultationType } = require('../utils/validators');

const appointmentController = {
    // Create new appointment
    createAppointment: async (req, res) => {
        try {
            const { provider_id, license_number, email, appointment_date, appointment_time, consultation_type, memo } = req.body;
            const userId = req.user.user_id;

            // Check if user has verified contact information (phone or email)
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const hasVerifiedPhone = user.phone_verified;
            const hasVerifiedEmail = user.emails && user.emails.some(e => e.verified);

            if (!hasVerifiedPhone && !hasVerifiedEmail) {
                return res.status(400).json({ 
                    error: 'Cannot create appointment without verified contact information',
                    details: 'Please verify your phone number or email address before creating an appointment'
                });
            }

            // Validate inputs
            if (!validateDate(appointment_date)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            if (!validateTime(appointment_time)) {
                return res.status(400).json({ error: 'Invalid time format' });
            }

            if (!validateConsultationType(consultation_type)) {
                return res.status(400).json({ error: 'Invalid consultation type' });
            }

            let providerId = provider_id;
            let provider = null;

            // Determine provider by provider_id, license_number, or email
            if (provider_id && provider_id.toString().trim() !== '') {
                // Existing method: by provider ID
                provider = await Provider.findById(provider_id);
            } else if (license_number && license_number.trim() !== '') {
                // New method: by license number
                provider = await Provider.findByLicenseOrVerifiedEmail(license_number, null);
            } else if (email && email.trim() !== '') {
                // New method: by verified email
                provider = await Provider.findByLicenseOrVerifiedEmail(null, email);
            } else {
                return res.status(400).json({
                    error: 'Must provide provider_id, license_number, or email',
                    details: 'At least one provider identifier is required'
                });
            }

            if (!provider) {
                return res.status(404).json({ error: 'Provider not found or not verified' });
            }

            providerId = provider.provider_id;

            // Check if provider is linked to user (for license/email method, auto-link if not already linked)
            const userProviders = await Provider.getUserProviders(userId);
            const isProviderLinked = userProviders.some(p => p.provider_id == providerId);

            if (!isProviderLinked) {
                // Auto-link the provider to user (as non-primary)
                await Provider.linkToUser(userId, providerId, false);
            }

            // Check if appointment date is in the future
            const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
            if (appointmentDateTime <= new Date()) {
                return res.status(400).json({ error: 'Appointment must be scheduled for a future time' });
            }

            const appointment = await Appointment.create({
                user_id: userId,
                provider_id: providerId,
                appointment_date,
                appointment_time,
                consultation_type,
                memo: memo || null
            });

            res.status(201).json({
                message: 'Appointment created successfully',
                appointment,
                provider_linked: !isProviderLinked
            });
        } catch (error) {
            console.error('Create appointment error:', error);
            res.status(500).json({ error: 'Failed to create appointment', details: error.message });
        }
    },

    // Get user's appointments
    getUserAppointments: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { status } = req.query;

            const appointments = await Appointment.getUserAppointments(userId, status);

            res.json({
                count: appointments.length,
                appointments
            });
        } catch (error) {
            console.error('Get appointments error:', error);
            res.status(500).json({ error: 'Failed to get appointments', details: error.message });
        }
    },

    // Get appointment by ID
    getAppointmentById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const appointment = await Appointment.findById(id);

            if (!appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            // Check if appointment belongs to user
            if (appointment.user_id != userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({ appointment });
        } catch (error) {
            console.error('Get appointment error:', error);
            res.status(500).json({ error: 'Failed to get appointment', details: error.message });
        }
    },

    // Cancel appointment
    cancelAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user.user_id;

            // Check if appointment exists and belongs to user
            const appointment = await Appointment.findById(id);
            if (!appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            if (appointment.user_id != userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            if (appointment.status !== 'scheduled') {
                return res.status(400).json({ error: `Appointment is already ${appointment.status}` });
            }

            const success = await Appointment.cancel(id, reason || 'Patient Rescheduled');

            if (!success) {
                return res.status(400).json({ error: 'Failed to cancel appointment' });
            }

            res.json({
                message: 'Appointment cancelled successfully',
                appointment_id: id,
                reason: reason || 'Patient Rescheduled'
            });
        } catch (error) {
            console.error('Cancel appointment error:', error);
            if (error.message.includes('24 hours')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to cancel appointment', details: error.message });
        }
    },

    // Search appointments by date range
    searchAppointmentsByDate: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({ error: 'Start date and end date are required' });
            }

            if (!validateDate(start_date) || !validateDate(end_date)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const appointments = await Appointment.searchByDate(userId, start_date, end_date);
            const totalInDateRange = await Appointment.getCountByDateRange(userId, start_date, end_date);

            res.json({
                start_date,
                end_date,
                count: appointments.length,
                total_in_date_range: totalInDateRange,
                appointments
            });
        } catch (error) {
            console.error('Search appointments error:', error);
            res.status(500).json({ error: 'Failed to search appointments', details: error.message });
        }
    },

    // Search appointments with multiple filters
    searchAppointments: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { provider_id, consultation_type, start_date, end_date } = req.query;

            // Validate dates if provided
            if (start_date && !validateDate(start_date)) {
                return res.status(400).json({ error: 'Invalid start date format' });
            }

            if (end_date && !validateDate(end_date)) {
                return res.status(400).json({ error: 'Invalid end date format' });
            }

            // Validate consultation type if provided
            if (consultation_type && consultation_type !== 'all') {
                if (!validateConsultationType(consultation_type)) {
                    return res.status(400).json({ error: 'Invalid consultation type' });
                }
            }

            const filters = {
                provider_id,
                consultation_type,
                start_date,
                end_date
            };

            const appointments = await Appointment.search(userId, filters);

            // Get total appointments count for the date range (if dates are provided)
            let totalInDateRange = null;
            if (start_date || end_date) {
                totalInDateRange = await Appointment.getCountByDateRange(userId, start_date, end_date);
            }

            res.json({
                filters,
                count: appointments.length,
                total_in_date_range: totalInDateRange,
                appointments
            });
        } catch (error) {
            console.error('Search appointments error:', error);
            res.status(500).json({ error: 'Failed to search appointments', details: error.message });
        }
    },

    // Get appointment statistics
    getAppointmentStats: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const stats = await Appointment.getStats(userId);

            res.json({ stats });
        } catch (error) {
            console.error('Get appointment stats error:', error);
            res.status(500).json({ error: 'Failed to get appointment statistics', details: error.message });
        }
    },

    // Get provider's appointments (for providers)
    getProviderAppointments: async (req, res) => {
        try {
            const { provider_id } = req.params;
            const { date } = req.query;

            // Check if provider is linked to user
            const userId = req.user.user_id;
            const userProviders = await Provider.getUserProviders(userId);
            const isProviderLinked = userProviders.some(p => p.provider_id == provider_id);

            if (!isProviderLinked) {
                return res.status(403).json({ error: 'Provider is not linked to your account' });
            }

            const appointments = await Appointment.getProviderAppointments(provider_id, date);

            res.json({
                provider_id,
                date: date || 'all',
                count: appointments.length,
                appointments
            });
        } catch (error) {
            console.error('Get provider appointments error:', error);
            res.status(500).json({ error: 'Failed to get provider appointments', details: error.message });
        }
    }
};

module.exports = appointmentController;
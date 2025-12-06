const Provider = require('../models/Provider');
const { validateLicenseNumber, validateEmail, validatePhone } = require('../utils/validators');

const providerController = {
    // Create new provider
    createProvider: async (req, res) => {
        try {
            const { license_number, name, email, phone, specialty } = req.body;

            // Validate inputs
            if (!validateLicenseNumber(license_number)) {
                return res.status(400).json({ error: 'Invalid license number format' });
            }

            if (email && email.trim() !== '' && !validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (phone && phone.trim() !== '' && !validatePhone(phone)) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }

            // Check if license number already exists
            const existingProvider = await Provider.findByLicenseNumber(license_number);
            if (existingProvider) {
                return res.status(400).json({ error: 'License number already registered' });
            }

            const provider = await Provider.create({
                license_number,
                name,
                email,
                phone,
                specialty
            });

            res.status(201).json({
                message: 'Provider created successfully',
                provider
            });
        } catch (error) {
            console.error('Create provider error:', error);
            res.status(500).json({ error: 'Failed to create provider', details: error.message });
        }
    },

    // Get all providers
    getAllProviders: async (req, res) => {
        try {
            const providers = await Provider.getAll();
            res.json({ providers });
        } catch (error) {
            console.error('Get providers error:', error);
            res.status(500).json({ error: 'Failed to get providers', details: error.message });
        }
    },

    // Get provider by ID
    getProviderById: async (req, res) => {
        try {
            const { id } = req.params;
            const provider = await Provider.findById(id);

            if (!provider) {
                return res.status(404).json({ error: 'Provider not found' });
            }

            res.json({ provider });
        } catch (error) {
            console.error('Get provider error:', error);
            res.status(500).json({ error: 'Failed to get provider', details: error.message });
        }
    },

    // Verify provider
    verifyProvider: async (req, res) => {
        try {
            const { id } = req.params;

            const success = await Provider.verify(id);

            if (!success) {
                return res.status(404).json({ error: 'Provider not found' });
            }

            res.json({
                message: 'Provider verified successfully'
            });
        } catch (error) {
            console.error('Verify provider error:', error);
            res.status(500).json({ error: 'Failed to verify provider', details: error.message });
        }
    },

    // Link provider to user
    linkProvider: async (req, res) => {
        try {
            // Check if req.body exists and is an object
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({ error: 'Request body is missing or invalid' });
            }

            const { provider_id, is_primary } = req.body;
            const userId = req.user?.user_id;

            // Validate input
            if (!provider_id) {
                return res.status(400).json({ error: 'Provider ID is required' });
            }

            // Convert provider_id to number if it's a string
            const providerIdNum = parseInt(provider_id);
            if (isNaN(providerIdNum)) {
                return res.status(400).json({ error: 'Invalid provider ID format' });
            }

            console.log('linkProvider: Looking for provider with ID:', providerIdNum);

            // Check if provider exists
            const provider = await Provider.findById(providerIdNum);
            console.log('linkProvider: Found provider:', provider ? 'Yes' : 'No');

            if (!provider) {
                return res.status(404).json({ error: 'Provider not found' });
            }

            console.log('linkProvider: Calling linkToUser with:', { userId, providerId: providerIdNum, isPrimary: is_primary || false });

            const linkId = await Provider.linkToUser(userId, providerIdNum, is_primary || false);

            console.log('linkProvider: Link created successfully, linkId:', linkId);

            res.status(201).json({
                message: is_primary ? 'Provider set as primary successfully' : 'Provider linked successfully',
                link_id: linkId,
                provider: {
                    id: provider.provider_id,
                    license_number: provider.license_number,
                    name: provider.name,
                    specialty: provider.specialty
                },
                is_primary: is_primary || false
            });
        } catch (error) {
            console.error('Link provider error:', error);
            console.error('Error stack:', error.stack);
            console.error('Request details:', {
                body: req.body,
                userId: req.user.user_id,
                user: req.user
            });

            // Build error response safely
            const errorResponse = {
                error: 'Failed to link provider',
                message: error.message
            };

            // Add optional fields if they exist
            if (error.code) errorResponse.code = error.code;
            if (error.sqlState) errorResponse.sqlState = error.sqlState;

            res.status(500).json(errorResponse);
        }
    },

    // Unlink provider from user
    unlinkProvider: async (req, res) => {
        try {
            const { provider_id } = req.params;
            const userId = req.user.user_id;

            const success = await Provider.unlinkFromUser(userId, provider_id);

            if (!success) {
                return res.status(404).json({ error: 'Provider link not found or already unlinked' });
            }

            res.json({
                message: 'Provider unlinked successfully'
            });
        } catch (error) {
            console.error('Unlink provider error:', error);
            res.status(500).json({ error: 'Failed to unlink provider', details: error.message });
        }
    },

    // Get user's providers
    getUserProviders: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const providers = await Provider.getUserProviders(userId);

            res.json({ providers });
        } catch (error) {
            console.error('Get user providers error:', error);
            res.status(500).json({ error: 'Failed to get user providers', details: error.message });
        }
    },

    // Get user's primary provider
    getPrimaryProvider: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const provider = await Provider.getUserPrimaryProvider(userId);

            if (!provider) {
                return res.status(404).json({ error: 'No primary provider found' });
            }

            res.json({ provider });
        } catch (error) {
            console.error('Get primary provider error:', error);
            res.status(500).json({ error: 'Failed to get primary provider', details: error.message });
        }
    },

    // Search providers
    searchProviders: async (req, res) => {
        try {
            const { q } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({ error: 'Search term must be at least 2 characters' });
            }

            const providers = await Provider.search(q.trim());

            res.json({
                search_term: q,
                count: providers.length,
                providers
            });
        } catch (error) {
            console.error('Search providers error:', error);
            res.status(500).json({ error: 'Failed to search providers', details: error.message });
        }
    }
};

module.exports = providerController;
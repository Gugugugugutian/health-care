const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validateEmail, validatePhone, validateHealthId, validatePassword } = require('../utils/validators');

const authController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { health_id, name, phone, password, email } = req.body;

            // Validate inputs
            if (!validateHealthId(health_id)) {
                return res.status(400).json({ error: 'Invalid health ID format' });
            }

            if (!validatePhone(phone)) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }

            if (email && !validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({
                    error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
                });
            }

            // Check if health ID already exists
            const existingUserById = await User.findByHealthId(health_id);
            if (existingUserById) {
                return res.status(400).json({ error: 'Health ID already registered' });
            }

            // Check if phone already exists
            const existingUserByPhone = await User.findByPhone(phone);
            if (existingUserByPhone) {
                return res.status(400).json({ error: 'Phone number already registered' });
            }

            // Check if email already exists
            if (email) {
                const existingUserByEmail = await User.findByEmail(email);
                if (existingUserByEmail) {
                    return res.status(400).json({ error: 'Email already registered' });
                }
            }

            // Create user
            const user = await User.create({ health_id, name, phone, password, email });

            // Generate token
            const token = generateToken(user.id);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    health_id: user.health_id,
                    name: user.name,
                    phone: user.phone
                },
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed', details: error.message });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                return res.status(400).json({ error: 'Identifier and password are required' });
            }

            // Find user by health_id, email, or phone
            let user = await User.findByHealthId(identifier);

            if (!user) {
                user = await User.findByEmail(identifier);
            }

            if (!user) {
                user = await User.findByPhone(identifier);
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const isPasswordValid = await User.verifyPassword(user, password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = generateToken(user.user_id);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.user_id,
                    health_id: user.health_id,
                    name: user.name,
                    phone: user.phone,
                    phone_verified: user.phone_verified
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed', details: error.message });
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.user_id);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Remove sensitive data
            delete user.password_hash;

            res.json({
                user
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile', details: error.message });
        }
    },

    // Add email to user
    addEmail: async (req, res) => {
        try {
            const { email, is_primary } = req.body;

            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Check if email already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const emailId = await User.addEmail(req.user.user_id, email, is_primary || false);

            res.status(201).json({
                message: 'Email added successfully',
                email_id: emailId,
                email,
                is_primary: is_primary || false
            });
        } catch (error) {
            console.error('Add email error:', error);
            res.status(500).json({ error: 'Failed to add email', details: error.message });
        }
    },

    // Verify email
    verifyEmail: async (req, res) => {
        try {
            const { email_id } = req.params;

            const success = await User.verifyEmail(email_id);

            if (!success) {
                return res.status(404).json({ error: 'Email not found' });
            }

            res.json({
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Verify email error:', error);
            res.status(500).json({ error: 'Failed to verify email', details: error.message });
        }
    },

    // Verify phone
    verifyPhone: async (req, res) => {
        try {
            const success = await User.verifyPhone(req.user.user_id);

            res.json({
                message: 'Phone verified successfully',
                verified: success
            });
        } catch (error) {
            console.error('Verify phone error:', error);
            res.status(500).json({ error: 'Failed to verify phone', details: error.message });
        }
    }
};

module.exports = authController;
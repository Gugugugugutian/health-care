const WellnessChallenge = require('../models/WellnessChallenge');
const Invitation = require('../models/Invitation');
const { validateDate, validateEmail, validatePhone } = require('../utils/validators');

const challengeController = {
    // Create new wellness challenge
    createChallenge: async (req, res) => {
        try {
            const { title, description, goal, start_date, end_date } = req.body;
            const created_by = req.user.user_id;

            // Validate inputs
            if (!title || title.trim().length < 3) {
                return res.status(400).json({ error: 'Title must be at least 3 characters' });
            }

            if (!goal || goal.trim().length < 5) {
                return res.status(400).json({ error: 'Goal must be at least 5 characters' });
            }

            if (!validateDate(start_date) || !validateDate(end_date)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const startDate = new Date(start_date);
            const endDate = new Date(end_date);

            if (startDate >= endDate) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }

            if (startDate < new Date()) {
                return res.status(400).json({ error: 'Start date cannot be in the past' });
            }

            const challenge = await WellnessChallenge.create({
                created_by,
                title: title.trim(),
                description: description ? description.trim() : null,
                goal: goal.trim(),
                start_date: start_date,
                end_date: end_date
            });

            res.status(201).json({
                message: 'Wellness challenge created successfully',
                challenge
            });
        } catch (error) {
            console.error('Create challenge error:', error);
            res.status(500).json({ error: 'Failed to create challenge', details: error.message });
        }
    },

    // Get user's challenges
    getUserChallenges: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const challenges = await WellnessChallenge.getUserChallenges(userId);

            res.json({
                count: challenges.length,
                challenges
            });
        } catch (error) {
            console.error('Get challenges error:', error);
            res.status(500).json({ error: 'Failed to get challenges', details: error.message });
        }
    },

    // Get challenge by ID
    getChallengeById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const challenge = await WellnessChallenge.findById(id);

            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            // Get participants
            const participants = await WellnessChallenge.getParticipants(id);

            // Check if user is participant or creator
            const isParticipant = participants.some(p => p.user_id == userId);
            const isCreator = challenge.created_by == userId;

            if (!isParticipant && !isCreator) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({
                challenge,
                participants,
                user_role: isCreator ? 'creator' : 'participant',
                participant_count: participants.length
            });
        } catch (error) {
            console.error('Get challenge error:', error);
            res.status(500).json({ error: 'Failed to get challenge', details: error.message });
        }
    },

    // Join challenge
    joinChallenge: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // Check if challenge exists
            const challenge = await WellnessChallenge.findById(id);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            // Check if challenge is active
            if (challenge.status !== 'active') {
                return res.status(400).json({ error: `Challenge is ${challenge.status}` });
            }

            // Check if challenge has ended
            const endDate = new Date(challenge.end_date);
            if (endDate < new Date()) {
                return res.status(400).json({ error: 'Challenge has ended' });
            }

            const participantId = await WellnessChallenge.addParticipant(id, userId);

            if (participantId === null) {
                return res.status(400).json({ error: 'Already participating in this challenge' });
            }

            res.status(201).json({
                message: 'Joined challenge successfully',
                challenge_id: id,
                participant_id: participantId
            });
        } catch (error) {
            console.error('Join challenge error:', error);
            res.status(500).json({ error: 'Failed to join challenge', details: error.message });
        }
    },

    // Update progress
    updateProgress: async (req, res) => {
        try {
            const { id } = req.params;
            const { progress, notes } = req.body;
            const userId = req.user.user_id;

            // Validate progress
            const progressNum = parseInt(progress);
            if (isNaN(progressNum) || progressNum < 0) {
                return res.status(400).json({ error: 'Progress must be a non-negative number' });
            }

            // Check if user is participating
            const userProgress = await WellnessChallenge.getUserProgress(id, userId);
            if (!userProgress) {
                return res.status(403).json({ error: 'You are not participating in this challenge' });
            }

            const success = await WellnessChallenge.updateUserProgress(id, userId, progressNum, notes);

            if (!success) {
                return res.status(400).json({ error: 'Failed to update progress' });
            }

            res.json({
                message: 'Progress updated successfully',
                challenge_id: id,
                progress: progressNum,
                notes: notes || null
            });
        } catch (error) {
            console.error('Update progress error:', error);
            res.status(500).json({ error: 'Failed to update progress', details: error.message });
        }
    },

    // Invite to challenge
    inviteToChallenge: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, phone } = req.body;
            const sent_by = req.user.user_id;

            // Check if challenge exists and user is creator
            const challenge = await WellnessChallenge.findById(id);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            if (challenge.created_by != sent_by) {
                return res.status(403).json({ error: 'Only the challenge creator can send invitations' });
            }

            // Validate contact info
            if (email && !validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (phone && !validatePhone(phone)) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }

            if (!email && !phone) {
                return res.status(400).json({ error: 'Email or phone is required' });
            }

            const invitation = await Invitation.create({
                sent_by,
                email: email || null,
                phone: phone || null,
                invitation_type: 'challenge',
                related_id: id
            });

            res.status(201).json({
                message: 'Invitation sent successfully',
                invitation
            });
        } catch (error) {
            console.error('Invite to challenge error:', error);
            res.status(500).json({ error: 'Failed to send invitation', details: error.message });
        }
    },

    // Search challenges
    searchChallenges: async (req, res) => {
        try {
            const { q } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({ error: 'Search term must be at least 2 characters' });
            }

            const challenges = await WellnessChallenge.search(q.trim());

            res.json({
                search_term: q,
                count: challenges.length,
                challenges
            });
        } catch (error) {
            console.error('Search challenges error:', error);
            res.status(500).json({ error: 'Failed to search challenges', details: error.message });
        }
    },

    // Get active challenges
    getActiveChallenges: async (req, res) => {
        try {
            const challenges = await WellnessChallenge.getActiveChallenges();

            res.json({
                count: challenges.length,
                challenges
            });
        } catch (error) {
            console.error('Get active challenges error:', error);
            res.status(500).json({ error: 'Failed to get active challenges', details: error.message });
        }
    },

    // Get challenge statistics
    getChallengeStats: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const stats = await WellnessChallenge.getStats(userId);

            res.json({ stats });
        } catch (error) {
            console.error('Get challenge stats error:', error);
            res.status(500).json({ error: 'Failed to get challenge statistics', details: error.message });
        }
    }
};

module.exports = challengeController;
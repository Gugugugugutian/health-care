const Invitation = require('../models/Invitation');
const { validateInvitationType } = require('../utils/validators');

const invitationController = {
    // Get sent invitations
    getSentInvitations: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const invitations = await Invitation.getSentInvitations(userId);

            res.json({
                count: invitations.length,
                invitations
            });
        } catch (error) {
            console.error('Get sent invitations error:', error);
            res.status(500).json({ error: 'Failed to get sent invitations', details: error.message });
        }
    },

    // Get invitations for current user's contact info
    getMyInvitations: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const user = req.user;

            // Get user's verified emails and phone
            const verifiedEmails = user.emails?.filter(e => e.verified).map(e => e.email) || [];
            const verifiedPhone = user.phone_verified ? user.phone : null;

            let allInvitations = [];

            // Get invitations for each verified email
            for (const email of verifiedEmails) {
                const emailInvitations = await Invitation.getInvitationsForContact(email, null);
                allInvitations = [...allInvitations, ...emailInvitations];
            }

            // Get invitations for verified phone
            if (verifiedPhone) {
                const phoneInvitations = await Invitation.getInvitationsForContact(null, verifiedPhone);
                allInvitations = [...allInvitations, ...phoneInvitations];
            }

            // Remove duplicates (in case same invitation was sent to multiple contact methods)
            const uniqueInvitations = allInvitations.filter((inv, index, self) =>
                index === self.findIndex((t) => t.invitation_uid === inv.invitation_uid)
            );

            res.json({
                count: uniqueInvitations.length,
                invitations: uniqueInvitations
            });
        } catch (error) {
            console.error('Get my invitations error:', error);
            res.status(500).json({ error: 'Failed to get invitations', details: error.message });
        }
    },

    // Get invitation by UID
    getInvitationByUid: async (req, res) => {
        try {
            const { uid } = req.params;

            const invitation = await Invitation.findByUid(uid);

            if (!invitation) {
                return res.status(404).json({ error: 'Invitation not found' });
            }

            res.json({ invitation });
        } catch (error) {
            console.error('Get invitation error:', error);
            res.status(500).json({ error: 'Failed to get invitation', details: error.message });
        }
    },

    // Accept invitation
    acceptInvitation: async (req, res) => {
        try {
            const { uid } = req.params;
            const userId = req.user.user_id;

            const success = await Invitation.accept(uid, userId);

            if (!success) {
                return res.status(400).json({ error: 'Failed to accept invitation' });
            }

            res.json({
                message: 'Invitation accepted successfully',
                invitation_uid: uid
            });
        } catch (error) {
            console.error('Accept invitation error:', error);
            if (error.message.includes('not found') || error.message.includes('expired')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to accept invitation', details: error.message });
        }
    },

    // Cancel invitation
    cancelInvitation: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const success = await Invitation.cancel(id, userId);

            if (!success) {
                return res.status(404).json({ error: 'Invitation not found or already processed' });
            }

            res.json({
                message: 'Invitation cancelled successfully',
                invitation_id: id
            });
        } catch (error) {
            console.error('Cancel invitation error:', error);
            res.status(500).json({ error: 'Failed to cancel invitation', details: error.message });
        }
    },

    // Create invitation (generic)
    createInvitation: async (req, res) => {
        try {
            const { email, phone, invitation_type, related_id, challenge_name, family_group_identifier, recipient_health_id } = req.body;
            const sent_by = req.user.user_id;

            // Validate inputs
            if (!validateInvitationType(invitation_type)) {
                return res.status(400).json({ error: 'Invalid invitation type' });
            }

            let finalEmail = email;
            let finalPhone = phone;

            // For platform invitations, email or phone is required (no need for recipient_health_id)
            if (invitation_type === 'platform') {
                if (!email && !phone) {
                    return res.status(400).json({ error: 'Email or phone is required for platform invitations' });
                }
            } else {
                // For other invitation types, check for recipient_health_id
                if (recipient_health_id && !email && !phone) {
                    const user = await Invitation.findUserByHealthId(recipient_health_id);
                    if (!user) {
                        return res.status(404).json({ error: 'User not found with the provided health ID' });
                    }
                    const userEmail = await Invitation.getUserPrimaryEmail(user.user_id);
                    if (!userEmail) {
                        return res.status(400).json({ error: 'User does not have a verified email for invitation' });
                    }
                    finalEmail = userEmail;
                } else if (!email && !phone) {
                    return res.status(400).json({ error: 'Email, phone, or recipient health ID is required' });
                }
            }

            let finalRelatedId = related_id;

            // If challenge_name is provided, find the challenge ID
            if (challenge_name && !related_id && invitation_type === 'challenge') {
                const challenge = await Invitation.findChallengeByName(challenge_name, sent_by);
                if (!challenge) {
                    return res.status(404).json({ error: 'Challenge not found with the provided name' });
                }
                finalRelatedId = challenge.challenge_id;
            }

            // If family_group_identifier is provided, find the family group ID
            if (family_group_identifier && !related_id && invitation_type === 'family') {
                // Try to find by group name first
                const familyGroup = await Invitation.findFamilyGroupByIdentifier(family_group_identifier, sent_by);
                if (!familyGroup) {
                    return res.status(404).json({ error: 'Family group not found with the provided identifier' });
                }
                finalRelatedId = familyGroup.family_id;
            }

            // Platform invitations don't require related_id
            if (invitation_type !== 'platform' && !finalRelatedId) {
                return res.status(400).json({ error: 'Related ID or identifier is required' });
            }

            // TODO: Validate that finalRelatedId exists and user has permission to invite (for non-platform invitations)

            const invitation = await Invitation.create({
                sent_by,
                email: finalEmail || null,
                phone: finalPhone || null,
                invitation_type,
                related_id: finalRelatedId || null
            });

            res.status(201).json({
                message: 'Invitation created successfully',
                invitation
            });
        } catch (error) {
            console.error('Create invitation error:', error);
            res.status(500).json({ error: 'Failed to create invitation', details: error.message });
        }
    },

    // Get invitation statistics
    getInvitationStats: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const stats = await Invitation.getStats(userId);

            res.json({ stats });
        } catch (error) {
            console.error('Get invitation stats error:', error);
            res.status(500).json({ error: 'Failed to get invitation statistics', details: error.message });
        }
    }
};

module.exports = invitationController;
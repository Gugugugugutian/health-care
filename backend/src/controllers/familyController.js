const FamilyGroup = require('../models/FamilyGroup');
const Invitation = require('../models/Invitation');
const { validateEmail, validatePhone } = require('../utils/validators');

const familyController = {
    // Create new family group
    createFamilyGroup: async (req, res) => {
        try {
            const { group_name } = req.body;
            const created_by = req.user.user_id;

            if (!group_name || group_name.trim().length < 2) {
                return res.status(400).json({ error: 'Group name must be at least 2 characters' });
            }

            const familyGroup = await FamilyGroup.create({
                group_name: group_name.trim(),
                created_by
            });

            res.status(201).json({
                message: 'Family group created successfully',
                family_group: familyGroup
            });
        } catch (error) {
            console.error('Create family group error:', error);
            res.status(500).json({ error: 'Failed to create family group', details: error.message });
        }
    },

    // Get user's family groups
    getUserFamilyGroups: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const familyGroups = await FamilyGroup.getUserFamilyGroups(userId);

            res.json({
                count: familyGroups.length,
                family_groups: familyGroups
            });
        } catch (error) {
            console.error('Get family groups error:', error);
            res.status(500).json({ error: 'Failed to get family groups', details: error.message });
        }
    },

    // Get family group by ID
    getFamilyGroupById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // Check if user is family member
            const isMember = await FamilyGroup.isMember(id, userId);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const familyGroup = await FamilyGroup.findById(id);
            if (!familyGroup) {
                return res.status(404).json({ error: 'Family group not found' });
            }

            const members = await FamilyGroup.getMembers(id);

            res.json({
                family_group: familyGroup,
                members,
                member_count: members.length
            });
        } catch (error) {
            console.error('Get family group error:', error);
            res.status(500).json({ error: 'Failed to get family group', details: error.message });
        }
    },

    // Add member to family group
    addMember: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, health_id, relationship, can_manage } = req.body;
            const currentUserId = req.user.user_id;

            // Check if current user can manage the family group
            const canManage = await FamilyGroup.canManage(id, currentUserId);
            if (!canManage) {
                return res.status(403).json({ error: 'You do not have permission to add members' });
            }

            // Get user_id from health_id if provided
            let targetUserId = user_id;
            if (health_id && !user_id) {
                const user = await FamilyGroup.findUserByHealthId(health_id);
                if (!user) {
                    return res.status(404).json({ error: 'User not found with the provided health ID' });
                }
                targetUserId = user.user_id;
            }

            if (!targetUserId) {
                return res.status(400).json({ error: 'Either user_id or health_id is required' });
            }

            const memberId = await FamilyGroup.addMember(id, targetUserId, relationship, can_manage || false);

            if (memberId === null) {
                return res.status(400).json({ error: 'User is already a member of this family group' });
            }

            res.status(201).json({
                message: 'Member added successfully',
                family_id: id,
                member_id: memberId,
                user_id: targetUserId,
                relationship: relationship || null,
                can_manage: can_manage || false
            });
        } catch (error) {
            console.error('Add member error:', error);
            res.status(500).json({ error: 'Failed to add member', details: error.message });
        }
    },

    // Remove member from family group
    removeMember: async (req, res) => {
        try {
            const { id, user_id } = req.params;
            const currentUserId = req.user.user_id;

            // Check if current user can manage the family group or is removing themselves
            const canManage = await FamilyGroup.canManage(id, currentUserId);
            const isRemovingSelf = currentUserId == user_id;

            if (!canManage && !isRemovingSelf) {
                return res.status(403).json({ error: 'You do not have permission to remove this member' });
            }

            // Cannot remove the last managing member
            if (isRemovingSelf) {
                const members = await FamilyGroup.getMembers(id);
                const managingMembers = members.filter(m => m.can_manage && m.user_id != currentUserId);
                if (managingMembers.length === 0) {
                    return res.status(400).json({ error: 'Cannot leave as the only managing member' });
                }
            }

            const success = await FamilyGroup.removeMember(id, user_id);

            if (!success) {
                return res.status(404).json({ error: 'Member not found' });
            }

            res.json({
                message: 'Member removed successfully',
                family_id: id,
                user_id
            });
        } catch (error) {
            console.error('Remove member error:', error);
            res.status(500).json({ error: 'Failed to remove member', details: error.message });
        }
    },

    // Update member
    updateMember: async (req, res) => {
        try {
            const { id, user_id } = req.params;
            const { relationship, can_manage } = req.body;
            const currentUserId = req.user.user_id;

            // Check if current user can manage the family group
            const canManage = await FamilyGroup.canManage(id, currentUserId);
            if (!canManage) {
                return res.status(403).json({ error: 'You do not have permission to update members' });
            }

            // Cannot remove management rights from yourself if you're the only manager
            if (can_manage === false && user_id == currentUserId) {
                const members = await FamilyGroup.getMembers(id);
                const otherManagingMembers = members.filter(m => m.can_manage && m.user_id != currentUserId);
                if (otherManagingMembers.length === 0) {
                    return res.status(400).json({ error: 'Cannot remove your own management rights as the only manager' });
                }
            }

            const success = await FamilyGroup.updateMember(id, user_id, relationship, can_manage);

            if (!success) {
                return res.status(404).json({ error: 'Member not found' });
            }

            res.json({
                message: 'Member updated successfully',
                family_id: id,
                user_id,
                relationship: relationship || null,
                can_manage: can_manage !== undefined ? can_manage : null
            });
        } catch (error) {
            console.error('Update member error:', error);
            res.status(500).json({ error: 'Failed to update member', details: error.message });
        }
    },

    // Invite to family group
    inviteToFamily: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, phone } = req.body;
            const sent_by = req.user.user_id;

            // Check if current user can manage the family group
            const canManage = await FamilyGroup.canManage(id, sent_by);
            if (!canManage) {
                return res.status(403).json({ error: 'You do not have permission to send invitations' });
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
                invitation_type: 'family',
                related_id: id
            });

            res.status(201).json({
                message: 'Invitation sent successfully',
                invitation
            });
        } catch (error) {
            console.error('Invite to family error:', error);
            res.status(500).json({ error: 'Failed to send invitation', details: error.message });
        }
    },

    // Delete family group
    deleteFamilyGroup: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const success = await FamilyGroup.delete(id, userId);

            if (!success) {
                return res.status(404).json({ error: 'Family group not found or permission denied' });
            }

            res.json({
                message: 'Family group deleted successfully',
                family_id: id
            });
        } catch (error) {
            console.error('Delete family group error:', error);
            if (error.message.includes('permission')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to delete family group', details: error.message });
        }
    },

    // Get family group statistics
    getFamilyStats: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const stats = await FamilyGroup.getStats(userId);

            res.json({ stats });
        } catch (error) {
            console.error('Get family stats error:', error);
            res.status(500).json({ error: 'Failed to get family statistics', details: error.message });
        }
    }
};

module.exports = familyController;
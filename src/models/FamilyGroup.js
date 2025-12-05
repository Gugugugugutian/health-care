const { pool } = require('../config/database');

class FamilyGroup {
    // Create new family group
    static async create(groupData) {
        const { group_name, created_by } = groupData;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                'INSERT INTO family_groups (group_name, created_by) VALUES (?, ?)',
                [group_name, created_by]
            );

            const familyId = result.insertId;

            // Add creator as family member with management rights
            await connection.execute(
                'INSERT INTO family_members (family_id, user_id, can_manage) VALUES (?, ?, ?)',
                [familyId, created_by, true]
            );

            await connection.commit();
            return { id: familyId, group_name, created_by };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get family group by ID
    static async findById(familyId) {
        const [rows] = await pool.execute(
            `SELECT fg.*, u.name as creator_name
             FROM family_groups fg
             JOIN users u ON fg.created_by = u.user_id
             WHERE fg.family_id = ?`,
            [familyId]
        );
        return rows[0];
    }

    // Get user's family groups
    static async getUserFamilyGroups(userId) {
        const [rows] = await pool.execute(
            `SELECT fg.*, fm.relationship, fm.can_manage
             FROM family_groups fg
             JOIN family_members fm ON fg.family_id = fm.family_id
             WHERE fm.user_id = ?
             ORDER BY fg.created_at DESC`,
            [userId]
        );
        return rows;
    }

    // Get family group members
    static async getMembers(familyId) {
        const [rows] = await pool.execute(
            `SELECT fm.*, u.name, u.health_id, u.phone, ue.email as primary_email
             FROM family_members fm
             JOIN users u ON fm.user_id = u.user_id
             LEFT JOIN user_emails ue ON u.user_id = ue.user_id AND ue.is_primary = TRUE
             WHERE fm.family_id = ?
             ORDER BY fm.can_manage DESC, fm.joined_at`,
            [familyId]
        );
        return rows;
    }

    // Add member to family group
    static async addMember(familyId, userId, relationship = null, canManage = false) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO family_members (family_id, user_id, relationship, can_manage) VALUES (?, ?, ?, ?)',
                [familyId, userId, relationship, canManage]
            );
            return result.insertId;
        } catch (error) {
            // If duplicate entry, member already exists
            if (error.code === 'ER_DUP_ENTRY') {
                return null;
            }
            throw error;
        }
    }

    // Remove member from family group
    static async removeMember(familyId, userId) {
        const [result] = await pool.execute(
            'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, userId]
        );
        return result.affectedRows > 0;
    }

    // Update member relationship
    static async updateMember(familyId, userId, relationship = null, canManage = null) {
        const updates = [];
        const params = [];

        if (relationship !== null) {
            updates.push('relationship = ?');
            params.push(relationship);
        }

        if (canManage !== null) {
            updates.push('can_manage = ?');
            params.push(canManage);
        }

        if (updates.length === 0) {
            return false;
        }

        params.push(familyId, userId);

        const [result] = await pool.execute(
            `UPDATE family_members SET ${updates.join(', ')} WHERE family_id = ? AND user_id = ?`,
            params
        );

        return result.affectedRows > 0;
    }

    // Check if user is family member
    static async isMember(familyId, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, userId]
        );
        return rows.length > 0;
    }

    // Check if user can manage family group
    static async canManage(familyId, userId) {
        const [rows] = await pool.execute(
            'SELECT can_manage FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, userId]
        );
        return rows.length > 0 && rows[0].can_manage;
    }

    // Delete family group
    static async delete(familyId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if user is creator or can manage
            const [groupRows] = await connection.execute(
                'SELECT created_by FROM family_groups WHERE family_id = ?',
                [familyId]
            );

            if (groupRows.length === 0) {
                throw new Error('Family group not found');
            }

            const [memberRows] = await connection.execute(
                'SELECT can_manage FROM family_members WHERE family_id = ? AND user_id = ?',
                [familyId, userId]
            );

            if (memberRows.length === 0 || (!memberRows[0].can_manage && groupRows[0].created_by !== userId)) {
                throw new Error('You do not have permission to delete this family group');
            }

            // Delete family group (cascade will delete members)
            const [result] = await connection.execute(
                'DELETE FROM family_groups WHERE family_id = ?',
                [familyId]
            );

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get family group statistics
    static async getStats(userId) {
        const [rows] = await pool.execute(
            `SELECT
                COUNT(DISTINCT fg.family_id) as total_groups,
                COUNT(DISTINCT fm2.user_id) as total_members,
                SUM(CASE WHEN fg.created_by = ? THEN 1 ELSE 0 END) as created
             FROM family_groups fg
             JOIN family_members fm ON fg.family_id = fm.family_id
             LEFT JOIN family_members fm2 ON fg.family_id = fm2.family_id
             WHERE fm.user_id = ?`,
            [userId, userId]
        );
        return rows[0];
    }
}

module.exports = FamilyGroup;
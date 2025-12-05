const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Invitation {
    // Create new invitation
    static async create(invitationData) {
        const { sent_by, email, phone, invitation_type, related_id } = invitationData;
        const invitation_uid = `INV${uuidv4().substring(0, 8).toUpperCase()}`;

        // Check if invitation already exists and is pending
        let existingInvitation = null;
        if (email) {
            const [emailRows] = await pool.execute(
                `SELECT * FROM invitations
                 WHERE email = ? AND invitation_type = ? AND related_id = ? AND status = 'pending'
                 AND expires_at > NOW()`,
                [email, invitation_type, related_id]
            );
            existingInvitation = emailRows[0];
        } else if (phone) {
            const [phoneRows] = await pool.execute(
                `SELECT * FROM invitations
                 WHERE phone = ? AND invitation_type = ? AND related_id = ? AND status = 'pending'
                 AND expires_at > NOW()`,
                [phone, invitation_type, related_id]
            );
            existingInvitation = phoneRows[0];
        }

        if (existingInvitation) {
            return existingInvitation;
        }

        const [result] = await pool.execute(
            `INSERT INTO invitations (invitation_uid, sent_by, email, phone, invitation_type, related_id, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 DAY))`,
            [invitation_uid, sent_by, email, phone, invitation_type, related_id]
        );

        return {
            id: result.insertId,
            invitation_uid,
            sent_by,
            email,
            phone,
            invitation_type,
            related_id,
            status: 'pending',
            expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
        };
    }

    // Get invitation by UID
    static async findByUid(invitationUid) {
        const [rows] = await pool.execute(
            `SELECT i.*, u.name as sender_name
             FROM invitations i
             JOIN users u ON i.sent_by = u.user_id
             WHERE i.invitation_uid = ?`,
            [invitationUid]
        );
        return rows[0];
    }

    // Get invitations sent by user
    static async getSentInvitations(userId) {
        const [rows] = await pool.execute(
            `SELECT i.*,
                    CASE
                        WHEN i.invitation_type = 'challenge' THEN wc.title
                        WHEN i.invitation_type = 'family' THEN fg.group_name
                        ELSE 'Data Share'
                    END as related_name
             FROM invitations i
             LEFT JOIN wellness_challenges wc ON i.invitation_type = 'challenge' AND i.related_id = wc.challenge_id
             LEFT JOIN family_groups fg ON i.invitation_type = 'family' AND i.related_id = fg.family_id
             WHERE i.sent_by = ?
             ORDER BY i.initiated_at DESC`,
            [userId]
        );
        return rows;
    }

    // Get invitations for email or phone
    static async getInvitationsForContact(email = null, phone = null) {
        let query = `SELECT i.*, u.name as sender_name,
                            CASE
                                WHEN i.invitation_type = 'challenge' THEN wc.title
                                WHEN i.invitation_type = 'family' THEN fg.group_name
                                ELSE 'Data Share'
                            END as related_name
                     FROM invitations i
                     JOIN users u ON i.sent_by = u.user_id
                     LEFT JOIN wellness_challenges wc ON i.invitation_type = 'challenge' AND i.related_id = wc.challenge_id
                     LEFT JOIN family_groups fg ON i.invitation_type = 'family' AND i.related_id = fg.family_id
                     WHERE i.status = 'pending' AND i.expires_at > NOW()`;

        const params = [];

        if (email) {
            query += ' AND i.email = ?';
            params.push(email);
        } else if (phone) {
            query += ' AND i.phone = ?';
            params.push(phone);
        } else {
            return [];
        }

        query += ' ORDER BY i.expires_at ASC';

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Accept invitation
    static async accept(invitationUid, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get invitation
            const [invitationRows] = await connection.execute(
                `SELECT * FROM invitations
                 WHERE invitation_uid = ? AND status = 'pending' AND expires_at > NOW()`,
                [invitationUid]
            );

            if (invitationRows.length === 0) {
                throw new Error('Invitation not found, expired, or already processed');
            }

            const invitation = invitationRows[0];

            // Process based on invitation type
            let result = false;
            switch (invitation.invitation_type) {
                case 'challenge':
                    // Add user to challenge
                    const [challengeResult] = await connection.execute(
                        'INSERT IGNORE INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
                        [invitation.related_id, userId]
                    );
                    result = challengeResult.affectedRows > 0;
                    break;

                case 'family':
                    // Add user to family group
                    const [familyResult] = await connection.execute(
                        'INSERT IGNORE INTO family_members (family_id, user_id) VALUES (?, ?)',
                        [invitation.related_id, userId]
                    );
                    result = familyResult.affectedRows > 0;
                    break;

                case 'data_share':
                    // For data share, we would typically create a sharing permission record
                    // For now, just mark as accepted
                    result = true;
                    break;
            }

            if (result) {
                // Update invitation status
                await connection.execute(
                    `UPDATE invitations
                     SET status = 'accepted', completed_at = NOW()
                     WHERE invitation_id = ?`,
                    [invitation.invitation_id]
                );
            }

            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Cancel invitation
    static async cancel(invitationId, userId) {
        const [result] = await pool.execute(
            `UPDATE invitations
             SET status = 'cancelled', completed_at = NOW()
             WHERE invitation_id = ? AND sent_by = ? AND status = 'pending'`,
            [invitationId, userId]
        );
        return result.affectedRows > 0;
    }

    // Expire old invitations (should be run as a cron job)
    static async expireOldInvitations() {
        const [result] = await pool.execute(
            `UPDATE invitations
             SET status = 'expired', completed_at = NOW()
             WHERE status = 'pending' AND expires_at <= NOW()`
        );
        return result.affectedRows;
    }

    // Get invitation statistics
    static async getStats(userId) {
        const [rows] = await pool.execute(
            `SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM invitations
             WHERE sent_by = ?`,
            [userId]
        );
        return rows[0];
    }
}

module.exports = Invitation;
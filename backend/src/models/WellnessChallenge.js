const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class WellnessChallenge {
    // Create new challenge
    static async create(challengeData) {
        const { created_by, title, description, goal, start_date, end_date } = challengeData;
        const challenge_uid = `CHL${uuidv4().substring(0, 8).toUpperCase()}`;

        const [result] = await pool.execute(
            `INSERT INTO wellness_challenges (challenge_uid, created_by, title, description, goal, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [challenge_uid, created_by, title, description, goal, start_date, end_date]
        );

        // Add creator as participant
        await pool.execute(
            'INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
            [result.insertId, created_by]
        );

        return {
            id: result.insertId,
            challenge_uid,
            created_by,
            title,
            description,
            goal,
            start_date,
            end_date,
            status: 'active'
        };
    }

    // Get challenge by ID
    static async findById(challengeId) {
        const [rows] = await pool.execute(
            `SELECT wc.*, u.name as creator_name, u.health_id
             FROM wellness_challenges wc
             JOIN users u ON wc.created_by = u.user_id
             WHERE wc.challenge_id = ?`,
            [challengeId]
        );
        return rows[0];
    }

    // Get challenge by UID
    static async findByUid(challengeUid) {
        const [rows] = await pool.execute(
            `SELECT wc.*, u.name as creator_name, u.health_id
             FROM wellness_challenges wc
             JOIN users u ON wc.created_by = u.user_id
             WHERE wc.challenge_uid = ?`,
            [challengeUid]
        );
        return rows[0];
    }

    // Get user's challenges (created or participating)
    static async getUserChallenges(userId) {
        const [rows] = await pool.execute(
            `SELECT DISTINCT wc.*,
                    CASE
                        WHEN wc.created_by = ? THEN 'creator'
                        ELSE 'participant'
                    END as user_role,
                    cp.progress
             FROM wellness_challenges wc
             LEFT JOIN challenge_participants cp ON wc.challenge_id = cp.challenge_id AND cp.user_id = ?
             WHERE wc.created_by = ? OR cp.user_id = ?
             ORDER BY wc.end_date DESC, wc.start_date DESC`,
            [userId, userId, userId, userId]
        );
        return rows;
    }

    // Get challenge participants
    static async getParticipants(challengeId) {
        const [rows] = await pool.execute(
            `SELECT cp.*, u.name, u.health_id, ue.email as primary_email
             FROM challenge_participants cp
             JOIN users u ON cp.user_id = u.user_id
             LEFT JOIN user_emails ue ON u.user_id = ue.user_id AND ue.is_primary = TRUE
             WHERE cp.challenge_id = ?
             ORDER BY cp.joined_at`,
            [challengeId]
        );
        return rows;
    }

    // Add participant to challenge
    static async addParticipant(challengeId, userId) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
                [challengeId, userId]
            );
            return result.insertId;
        } catch (error) {
            // If duplicate entry, participant already exists
            if (error.code === 'ER_DUP_ENTRY') {
                return null;
            }
            throw error;
        }
    }

    // Update participant progress
    static async updateProgress(participantId, progress, notes = null) {
        const [result] = await pool.execute(
            'UPDATE challenge_participants SET progress = ?, progress_notes = ? WHERE participant_id = ?',
            [progress, notes, participantId]
        );
        return result.affectedRows > 0;
    }

    // Update user's progress in a challenge
    static async updateUserProgress(challengeId, userId, progress, notes = null) {
        const [result] = await pool.execute(
            'UPDATE challenge_participants SET progress = ?, progress_notes = ? WHERE challenge_id = ? AND user_id = ?',
            [progress, notes, challengeId, userId]
        );
        return result.affectedRows > 0;
    }

    // Get user's progress in a challenge
    static async getUserProgress(challengeId, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?',
            [challengeId, userId]
        );
        return rows[0];
    }

    // Complete challenge
    static async complete(challengeId) {
        const [result] = await pool.execute(
            `UPDATE wellness_challenges
             SET status = 'completed'
             WHERE challenge_id = ? AND status = 'active' AND end_date <= CURDATE()`,
            [challengeId]
        );
        return result.affectedRows > 0;
    }

    // Search challenges
    static async search(searchTerm) {
        const [rows] = await pool.execute(
            `SELECT wc.*, u.name as creator_name
             FROM wellness_challenges wc
             JOIN users u ON wc.created_by = u.user_id
             WHERE wc.title LIKE ? OR wc.description LIKE ? OR wc.goal LIKE ?
             ORDER BY wc.end_date DESC`,
            [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );
        return rows;
    }

    // Get active challenges
    static async getActiveChallenges() {
        const [rows] = await pool.execute(
            `SELECT wc.*, u.name as creator_name, COUNT(cp.user_id) as participant_count
             FROM wellness_challenges wc
             JOIN users u ON wc.created_by = u.user_id
             LEFT JOIN challenge_participants cp ON wc.challenge_id = cp.challenge_id
             WHERE wc.status = 'active' AND wc.end_date >= CURDATE()
             GROUP BY wc.challenge_id
             ORDER BY wc.start_date`,
            []
        );
        return rows;
    }

    // Get challenge statistics
    static async getStats(userId) {
        const [rows] = await pool.execute(
            `SELECT
                COUNT(DISTINCT wc.challenge_id) as total_challenges,
                SUM(CASE WHEN wc.created_by = ? THEN 1 ELSE 0 END) as created,
                SUM(CASE WHEN wc.created_by != ? THEN 1 ELSE 0 END) as participating,
                AVG(cp.progress) as avg_progress
             FROM wellness_challenges wc
             LEFT JOIN challenge_participants cp ON wc.challenge_id = cp.challenge_id AND cp.user_id = ?
             WHERE wc.created_by = ? OR cp.user_id = ?`,
            [userId, userId, userId, userId, userId]
        );
        return rows[0];
    }

    // Delete challenge (only creator can delete)
    static async delete(challengeId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if user is the creator
            const [challengeRows] = await connection.execute(
                'SELECT created_by FROM wellness_challenges WHERE challenge_id = ?',
                [challengeId]
            );

            if (challengeRows.length === 0) {
                await connection.rollback();
                return false;
            }

            if (challengeRows[0].created_by != userId) {
                await connection.rollback();
                return false;
            }

            // Delete participants first
            await connection.execute(
                'DELETE FROM challenge_participants WHERE challenge_id = ?',
                [challengeId]
            );

            // Delete the challenge
            const [result] = await connection.execute(
                'DELETE FROM wellness_challenges WHERE challenge_id = ?',
                [challengeId]
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

    // Leave challenge (remove participant)
    static async leaveChallenge(challengeId, userId) {
        const [result] = await pool.execute(
            'DELETE FROM challenge_participants WHERE challenge_id = ? AND user_id = ?',
            [challengeId, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = WellnessChallenge;
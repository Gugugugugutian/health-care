const User = require('../models/User');
const { pool } = require('../config/database');

const userStatsController = {
    // Get most active users
    getMostActiveUsers: async (req, res) => {
        try {
            const { limit } = req.query;
            const limitNum = limit ? parseInt(limit) : 5;

            if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
                return res.status(400).json({ error: 'Limit must be between 1 and 20' });
            }

            const users = await User.getMostActiveUsers(limitNum);

            res.json({
                count: users.length,
                limit: limitNum,
                users
            });
        } catch (error) {
            console.error('Get most active users error:', error);
            res.status(500).json({ error: 'Failed to get most active users', details: error.message });
        }
    },

    // Get user activity statistics
    getUserActivityStats: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // Get user's health metrics count
            const [healthMetricsResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM health_metrics WHERE user_id = ?',
                [userId]
            );

            // Get user's challenge participation count
            const [challengesResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM challenge_participants WHERE user_id = ?',
                [userId]
            );

            // Get user's appointment count
            const [appointmentsResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM appointments WHERE user_id = ?',
                [userId]
            );

            const stats = {
                health_metrics: healthMetricsResult[0]?.count || 0,
                challenges: challengesResult[0]?.count || 0,
                appointments: appointmentsResult[0]?.count || 0,
                total_activity: (healthMetricsResult[0]?.count || 0) +
                               (challengesResult[0]?.count || 0) * 2 +
                               (appointmentsResult[0]?.count || 0)
            };

            res.json({ stats });
        } catch (error) {
            console.error('Get user activity stats error:', error);
            res.status(500).json({ error: 'Failed to get user activity statistics', details: error.message });
        }
    }
};

module.exports = userStatsController;
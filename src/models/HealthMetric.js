const { pool } = require('../config/database');

class HealthMetric {
    // Add health metric
    static async add(metricData) {
        const { user_id, metric_date, metric_type, value, unit, notes } = metricData;

        const [result] = await pool.execute(
            `INSERT INTO health_metrics (user_id, metric_date, metric_type, value, unit, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, metric_date, metric_type, value, unit, notes]
        );

        return {
            id: result.insertId,
            user_id,
            metric_date,
            metric_type,
            value,
            unit,
            notes
        };
    }

    // Get user's health metrics
    static async getUserMetrics(userId, startDate = null, endDate = null, metricType = null) {
        let query = `SELECT * FROM health_metrics WHERE user_id = ?`;
        const params = [userId];

        if (startDate) {
            query += ' AND metric_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND metric_date <= ?';
            params.push(endDate);
        }

        if (metricType) {
            query += ' AND metric_type = ?';
            params.push(metricType);
        }

        query += ' ORDER BY metric_date DESC, recorded_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Get monthly summary
    static async getMonthlySummary(userId, year, month) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

        const [rows] = await pool.execute(
            `SELECT
                metric_type,
                COUNT(*) as count,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                MIN(metric_date) as first_date,
                MAX(metric_date) as last_date
             FROM health_metrics
             WHERE user_id = ? AND metric_date BETWEEN ? AND ?
             GROUP BY metric_type
             ORDER BY metric_type`,
            [userId, startDate, endDate]
        );
        return rows;
    }

    // Get metric statistics
    static async getStats(userId, metricType = null) {
        let query = `SELECT
                        COUNT(*) as total_entries,
                        COUNT(DISTINCT metric_type) as metric_types,
                        MIN(metric_date) as first_record,
                        MAX(metric_date) as last_record
                     FROM health_metrics
                     WHERE user_id = ?`;

        const params = [userId];

        if (metricType) {
            query += ' AND metric_type = ?';
            params.push(metricType);
        }

        const [rows] = await pool.execute(query, params);
        return rows[0];
    }

    // Search metrics
    static async search(userId, searchTerm) {
        const [rows] = await pool.execute(
            `SELECT * FROM health_metrics
             WHERE user_id = ? AND (metric_type LIKE ? OR notes LIKE ?)
             ORDER BY metric_date DESC`,
            [userId, `%${searchTerm}%`, `%${searchTerm}%`]
        );
        return rows;
    }

    // Get latest metrics by type
    static async getLatestMetrics(userId, limit = 10) {
        const [rows] = await pool.execute(
            `SELECT hm1.*
             FROM health_metrics hm1
             WHERE hm1.user_id = ?
               AND hm1.recorded_at = (
                   SELECT MAX(hm2.recorded_at)
                   FROM health_metrics hm2
                   WHERE hm2.user_id = hm1.user_id
                     AND hm2.metric_type = hm1.metric_type
                     AND hm2.metric_date = hm1.metric_date
               )
             ORDER BY hm1.metric_date DESC, hm1.metric_type
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    }

    // Delete metric
    static async delete(metricId, userId) {
        const [result] = await pool.execute(
            'DELETE FROM health_metrics WHERE metric_id = ? AND user_id = ?',
            [metricId, userId]
        );
        return result.affectedRows > 0;
    }

    // Update metric
    static async update(metricId, userId, updates) {
        const allowedFields = ['value', 'unit', 'notes', 'metric_date'];
        const updateFields = [];
        const params = [];

        for (const [field, value] of Object.entries(updates)) {
            if (allowedFields.includes(field) && value !== undefined) {
                updateFields.push(`${field} = ?`);
                params.push(value);
            }
        }

        if (updateFields.length === 0) {
            return false;
        }

        params.push(metricId, userId);

        const [result] = await pool.execute(
            `UPDATE health_metrics SET ${updateFields.join(', ')} WHERE metric_id = ? AND user_id = ?`,
            params
        );

        return result.affectedRows > 0;
    }
}

module.exports = HealthMetric;
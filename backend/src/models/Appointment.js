const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Appointment {
    // Create new appointment
    static async create(appointmentData) {
        const { user_id, provider_id, appointment_date, appointment_time, consultation_type, memo } = appointmentData;
        const appointment_uid = `APT${uuidv4().substring(0, 8).toUpperCase()}`;

        const [result] = await pool.execute(
            `INSERT INTO appointments (appointment_uid, user_id, provider_id, appointment_date, appointment_time, consultation_type, memo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [appointment_uid, user_id, provider_id, appointment_date, appointment_time, consultation_type, memo]
        );

        return {
            id: result.insertId,
            appointment_uid,
            user_id,
            provider_id,
            appointment_date,
            appointment_time,
            consultation_type,
            memo,
            status: 'scheduled'
        };
    }

    // Get appointment by ID
    static async findById(appointmentId) {
        const [rows] = await pool.execute(
            `SELECT a.*, u.name as user_name, u.health_id, p.name as provider_name, p.license_number
             FROM appointments a
             JOIN users u ON a.user_id = u.user_id
             JOIN providers p ON a.provider_id = p.provider_id
             WHERE a.appointment_id = ?`,
            [appointmentId]
        );
        return rows[0];
    }

    // Get appointment by UID
    static async findByUid(appointmentUid) {
        const [rows] = await pool.execute(
            `SELECT a.*, u.name as user_name, u.health_id, p.name as provider_name, p.license_number
             FROM appointments a
             JOIN users u ON a.user_id = u.user_id
             JOIN providers p ON a.provider_id = p.provider_id
             WHERE a.appointment_uid = ?`,
            [appointmentUid]
        );
        return rows[0];
    }

    // Get user's appointments
    static async getUserAppointments(userId, status = null) {
        let query = `SELECT a.*, p.name as provider_name, p.license_number, p.specialty
                     FROM appointments a
                     JOIN providers p ON a.provider_id = p.provider_id
                     WHERE a.user_id = ?`;

        const params = [userId];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Get provider's appointments
    static async getProviderAppointments(providerId, date = null) {
        let query = `SELECT a.*, u.name as user_name, u.health_id
                     FROM appointments a
                     JOIN users u ON a.user_id = u.user_id
                     WHERE a.provider_id = ? AND a.status = 'scheduled'`;

        const params = [providerId];

        if (date) {
            query += ' AND a.appointment_date = ?';
            params.push(date);
        }

        query += ' ORDER BY a.appointment_date, a.appointment_time';

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Cancel appointment
    static async cancel(appointmentId, reason) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if appointment can be cancelled (24 hours before)
            const [appointmentRows] = await connection.execute(
                'SELECT appointment_date, appointment_time FROM appointments WHERE appointment_id = ? AND status = "scheduled"',
                [appointmentId]
            );

            if (appointmentRows.length === 0) {
                throw new Error('Appointment not found or already cancelled/completed');
            }

            const appointment = appointmentRows[0];
            const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
            const now = new Date();
            const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);

            if (hoursDifference < 24) {
                throw new Error('Appointment can only be cancelled at least 24 hours before scheduled time');
            }

            const [result] = await connection.execute(
                `UPDATE appointments
                 SET status = 'cancelled', cancellation_reason = ?, cancelled_at = CURRENT_TIMESTAMP
                 WHERE appointment_id = ?`,
                [reason, appointmentId]
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

    // Search appointments by date
    static async searchByDate(userId, startDate, endDate) {
        const [rows] = await pool.execute(
            `SELECT a.*, p.name as provider_name, p.license_number
             FROM appointments a
             JOIN providers p ON a.provider_id = p.provider_id
             WHERE a.user_id = ? AND a.appointment_date BETWEEN ? AND ?
             ORDER BY a.appointment_date, a.appointment_time`,
            [userId, startDate, endDate]
        );
        return rows;
    }

    // Search appointments by provider, consultation type, and date range
    static async search(userId, filters = {}) {
        let query = `SELECT a.*, p.name as provider_name, p.license_number, p.specialty
                     FROM appointments a
                     JOIN providers p ON a.provider_id = p.provider_id
                     WHERE a.user_id = ?`;

        const params = [userId];

        // Add provider filter
        if (filters.provider_id && filters.provider_id !== 'all') {
            query += ' AND a.provider_id = ?';
            params.push(filters.provider_id);
        }

        // Add consultation type filter
        if (filters.consultation_type && filters.consultation_type !== 'all') {
            query += ' AND a.consultation_type = ?';
            params.push(filters.consultation_type);
        }

        // Add date range filter
        if (filters.start_date && filters.end_date) {
            query += ' AND a.appointment_date BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        } else if (filters.start_date) {
            query += ' AND a.appointment_date >= ?';
            params.push(filters.start_date);
        } else if (filters.end_date) {
            query += ' AND a.appointment_date <= ?';
            params.push(filters.end_date);
        }

        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Get appointment statistics
    static async getStats(userId) {
        const [rows] = await pool.execute(
            `SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM appointments
             WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    }

    // Get appointment count by date range
    static async getCountByDateRange(userId, startDate = null, endDate = null) {
        let query = `SELECT COUNT(*) as total
                     FROM appointments
                     WHERE user_id = ?`;

        const params = [userId];

        if (startDate && endDate) {
            query += ' AND appointment_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ' AND appointment_date >= ?';
            params.push(startDate);
        } else if (endDate) {
            query += ' AND appointment_date <= ?';
            params.push(endDate);
        }

        const [rows] = await pool.execute(query, params);
        return rows[0].total;
    }
}

module.exports = Appointment;
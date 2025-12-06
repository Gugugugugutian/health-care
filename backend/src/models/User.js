const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        const { health_id, name, phone, password, email } = userData;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert user
            const [userResult] = await connection.execute(
                'INSERT INTO users (health_id, name, phone, password_hash) VALUES (?, ?, ?, ?)',
                [health_id, name, phone, password_hash]
            );

            const userId = userResult.insertId;

            // Insert primary email
            if (email) {
                await connection.execute(
                    'INSERT INTO user_emails (user_id, email, is_primary) VALUES (?, ?, ?)',
                    [userId, email, true]
                );
            }

            await connection.commit();
            return { id: userId, health_id, name, phone };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Find user by health_id
    static async findByHealthId(health_id) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE health_id = ?',
            [health_id]
        );
        return rows[0];
    }

    // Find user by email
    static async findByEmail(email) {
        const [rows] = await pool.execute(
            `SELECT u.* FROM users u
             JOIN user_emails ue ON u.user_id = ue.user_id
             WHERE ue.email = ?`,
            [email]
        );
        return rows[0];
    }

    // Find user by phone
    static async findByPhone(phone) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );
        return rows[0];
    }

    // Get user by ID with emails
    static async findById(userId) {
        const [userRows] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );

        if (!userRows[0]) return null;

        const [emailRows] = await pool.execute(
            'SELECT * FROM user_emails WHERE user_id = ?',
            [userId]
        );

        return {
            ...userRows[0],
            emails: emailRows
        };
    }

    // Verify password
    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }

    // Add email to user
    static async addEmail(userId, email, isPrimary = false) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // If setting as primary, update existing primary emails
            if (isPrimary) {
                await connection.execute(
                    'UPDATE user_emails SET is_primary = FALSE WHERE user_id = ?',
                    [userId]
                );
            }

            const [result] = await connection.execute(
                'INSERT INTO user_emails (user_id, email, is_primary) VALUES (?, ?, ?)',
                [userId, email, isPrimary]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Verify email
    static async verifyEmail(emailId) {
        const [result] = await pool.execute(
            'UPDATE user_emails SET verified = TRUE WHERE email_id = ?',
            [emailId]
        );
        return result.affectedRows > 0;
    }

    // Verify phone
    static async verifyPhone(userId) {
        const [result] = await pool.execute(
            'UPDATE users SET phone_verified = TRUE WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }

    // Update user information
    static async update(userId, updates) {
        const allowedFields = ['name', 'phone'];
        const fieldsToUpdate = {};

        // Filter allowed fields
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fieldsToUpdate[field] = updates[field];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return false;
        }

        // Build SET clause
        const setClause = Object.keys(fieldsToUpdate)
            .map(field => `${field} = ?`)
            .join(', ');

        const values = Object.values(fieldsToUpdate);
        values.push(userId);

        const [result] = await pool.execute(
            `UPDATE users SET ${setClause} WHERE user_id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Delete email
    static async deleteEmail(emailId, userId) {
        const [result] = await pool.execute(
            'DELETE FROM user_emails WHERE email_id = ? AND user_id = ?',
            [emailId, userId]
        );
        return result.affectedRows > 0;
    }

    // Update phone number
    static async updatePhone(userId, newPhone) {
        // First check if phone is already used by another user
        const [existing] = await pool.execute(
            'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
            [newPhone, userId]
        );

        if (existing.length > 0) {
            throw new Error('Phone number already in use');
        }

        const [result] = await pool.execute(
            'UPDATE users SET phone = ?, phone_verified = FALSE WHERE user_id = ?',
            [newPhone, userId]
        );

        return result.affectedRows > 0;
    }

    // Get all users
    static async getAll() {
        const [rows] = await pool.execute(
            'SELECT user_id, health_id, name, phone, phone_verified, created_at FROM users'
        );
        return rows;
    }
}

module.exports = User;
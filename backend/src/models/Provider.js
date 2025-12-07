const { pool } = require('../config/database');

class Provider {
    // Create new provider
    static async create(providerData) {
        const { license_number, name, email, phone, specialty } = providerData;

        const [result] = await pool.execute(
            'INSERT INTO providers (license_number, name, email, phone, specialty) VALUES (?, ?, ?, ?, ?)',
            [license_number, name, email, phone, specialty]
        );

        return { id: result.insertId, license_number, name, email, phone, specialty };
    }

    // Find provider by license number
    static async findByLicenseNumber(license_number) {
        const [rows] = await pool.execute(
            'SELECT * FROM providers WHERE license_number = ?',
            [license_number]
        );
        return rows[0];
    }

    // Find provider by ID
    static async findById(providerId) {
        const [rows] = await pool.execute(
            'SELECT * FROM providers WHERE provider_id = ?',
            [providerId]
        );
        return rows[0];
    }

    // Verify provider
    static async verify(providerId) {
        const [result] = await pool.execute(
            'UPDATE providers SET verified = TRUE WHERE provider_id = ?',
            [providerId]
        );
        return result.affectedRows > 0;
    }

    // Link provider to user
    static async linkToUser(userId, providerId, isPrimary = false) {
        try {
            console.log(`linkToUser: Starting for user ${userId}, provider ${providerId}, isPrimary: ${isPrimary}`);

            // Check if already linked (active)
            const [existing] = await pool.execute(
                'SELECT user_provider_id FROM user_providers WHERE user_id = ? AND provider_id = ? AND unlinked_at IS NULL',
                [userId, providerId]
            );

            console.log(`linkToUser: Existing active links found: ${existing.length}`);

            if (existing.length > 0) {
                console.log(`linkToUser: Provider already linked, user_provider_id: ${existing[0].user_provider_id}`);
                // Already linked, update is_primary if needed
                if (isPrimary) {
                    console.log(`linkToUser: Setting as primary, updating other providers...`);
                    // First, set all other providers as non-primary
                    const [updateOthersResult] = await pool.execute(
                        'UPDATE user_providers SET is_primary = FALSE WHERE user_id = ? AND unlinked_at IS NULL',
                        [userId]
                    );
                    console.log(`linkToUser: Updated ${updateOthersResult.affectedRows} other providers to non-primary`);

                    // Then set this one as primary
                    const [updatePrimaryResult] = await pool.execute(
                        'UPDATE user_providers SET is_primary = TRUE WHERE user_id = ? AND provider_id = ?',
                        [userId, providerId]
                    );
                    console.log(`linkToUser: Set provider as primary, affected rows: ${updatePrimaryResult.affectedRows}`);
                }
                return existing[0].user_provider_id;
            }

            // Check if there's an unlinked record (deleted previously)
            const [unlinked] = await pool.execute(
                'SELECT user_provider_id FROM user_providers WHERE user_id = ? AND provider_id = ? AND unlinked_at IS NOT NULL',
                [userId, providerId]
            );

            if (unlinked.length > 0) {
                console.log(`linkToUser: Found unlinked record, reactivating...`);
                // Reactivate the unlinked record
                if (isPrimary) {
                    // First, set all other providers as non-primary
                    await pool.execute(
                        'UPDATE user_providers SET is_primary = FALSE WHERE user_id = ? AND unlinked_at IS NULL',
                        [userId]
                    );
                }

                // Reactivate by setting unlinked_at to NULL and updating linked_at
                const [updateResult] = await pool.execute(
                    'UPDATE user_providers SET unlinked_at = NULL, linked_at = CURRENT_TIMESTAMP, is_primary = ? WHERE user_provider_id = ?',
                    [isPrimary, unlinked[0].user_provider_id]
                );
                console.log(`linkToUser: Reactivated link, affected rows: ${updateResult.affectedRows}`);
                return unlinked[0].user_provider_id;
            }

            console.log(`linkToUser: Provider not linked, creating new link...`);
            // If setting as primary, update existing primary providers
            if (isPrimary) {
                console.log(`linkToUser: Setting as primary, updating existing primary providers...`);
                const [updateResult] = await pool.execute(
                    'UPDATE user_providers SET is_primary = FALSE WHERE user_id = ? AND unlinked_at IS NULL',
                    [userId]
                );
                console.log(`linkToUser: Updated ${updateResult.affectedRows} existing primary providers`);
            }

            const [result] = await pool.execute(
                'INSERT INTO user_providers (user_id, provider_id, is_primary) VALUES (?, ?, ?)',
                [userId, providerId, isPrimary]
            );

            console.log(`linkToUser: Inserted new link, insertId: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error(`linkToUser: Error occurred:`, error.message);
            console.error(`linkToUser: Error stack:`, error.stack);
            throw error;
        }
    }

    // Unlink provider from user
    static async unlinkFromUser(userId, providerId) {
        const [result] = await pool.execute(
            'UPDATE user_providers SET unlinked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider_id = ? AND unlinked_at IS NULL',
            [userId, providerId]
        );
        return result.affectedRows > 0;
    }

    // Get user's providers
    static async getUserProviders(userId) {
        const [rows] = await pool.execute(
            `SELECT p.*, up.is_primary, up.verified as link_verified, up.linked_at
             FROM providers p
             JOIN user_providers up ON p.provider_id = up.provider_id
             WHERE up.user_id = ? AND up.unlinked_at IS NULL
             ORDER BY up.is_primary DESC`,
            [userId]
        );
        return rows;
    }

    // Get user's primary provider
    static async getUserPrimaryProvider(userId) {
        const [rows] = await pool.execute(
            `SELECT p.* FROM providers p
             JOIN user_providers up ON p.provider_id = up.provider_id
             WHERE up.user_id = ? AND up.is_primary = TRUE AND up.unlinked_at IS NULL`,
            [userId]
        );
        return rows[0];
    }

    // Search providers
    static async search(searchTerm) {
        const [rows] = await pool.execute(
            `SELECT * FROM providers
             WHERE name LIKE ? OR license_number LIKE ? OR specialty LIKE ? OR email LIKE ?
             ORDER BY verified DESC, name ASC`,
            [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );
        return rows;
    }

    // Find provider by license number or verified email
    static async findByLicenseOrVerifiedEmail(licenseNumber = null, email = null) {
        let query = 'SELECT * FROM providers WHERE ';
        const params = [];

        if (licenseNumber) {
            query += 'license_number = ?';
            params.push(licenseNumber);
        } else if (email) {
            query += 'email = ? AND verified = TRUE';
            params.push(email);
        } else {
            return null;
        }

        const [rows] = await pool.execute(query, params);
        return rows[0];
    }

    // Get all providers
    static async getAll() {
        const [rows] = await pool.execute(
            'SELECT * FROM providers ORDER BY verified DESC, name ASC'
        );
        return rows;
    }
}

module.exports = Provider;
const HealthMetric = require('../models/HealthMetric');
const { validateDate } = require('../utils/validators');

const healthMetricController = {
    // Add health metric
    addHealthMetric: async (req, res) => {
        try {
            const { metric_date, metric_type, value, unit, notes } = req.body;
            const user_id = req.user.user_id;

            // Validate inputs
            if (!metric_type || metric_type.trim().length < 2) {
                return res.status(400).json({ error: 'Metric type must be at least 2 characters' });
            }

            if (!validateDate(metric_date)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const valueNum = parseFloat(value);
            if (isNaN(valueNum)) {
                return res.status(400).json({ error: 'Value must be a number' });
            }

            const metric = await HealthMetric.add({
                user_id,
                metric_date,
                metric_type: metric_type.trim(),
                value: valueNum,
                unit: unit || null,
                notes: notes || null
            });

            res.status(201).json({
                message: 'Health metric added successfully',
                metric
            });
        } catch (error) {
            console.error('Add health metric error:', error);
            res.status(500).json({ error: 'Failed to add health metric', details: error.message });
        }
    },

    // Get user's health metrics
    getHealthMetrics: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const { start_date, end_date, metric_type } = req.query;

            // Validate date filters if provided
            if (start_date && !validateDate(start_date)) {
                return res.status(400).json({ error: 'Invalid start date format' });
            }

            if (end_date && !validateDate(end_date)) {
                return res.status(400).json({ error: 'Invalid end date format' });
            }

            const metrics = await HealthMetric.getUserMetrics(user_id, start_date, end_date, metric_type);

            res.json({
                count: metrics.length,
                metrics
            });
        } catch (error) {
            console.error('Get health metrics error:', error);
            res.status(500).json({ error: 'Failed to get health metrics', details: error.message });
        }
    },

    // Get monthly summary
    getMonthlySummary: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const { year, month } = req.query;

            if (!year || !month) {
                return res.status(400).json({ error: 'Year and month are required' });
            }

            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
                return res.status(400).json({ error: 'Invalid year' });
            }

            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({ error: 'Invalid month' });
            }

            const summary = await HealthMetric.getMonthlySummary(user_id, yearNum, monthNum);

            res.json({
                year: yearNum,
                month: monthNum,
                summary
            });
        } catch (error) {
            console.error('Get monthly summary error:', error);
            res.status(500).json({ error: 'Failed to get monthly summary', details: error.message });
        }
    },

    // Get metric by ID
    getMetricById: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.user_id;

            // Get all metrics and find the specific one
            const metrics = await HealthMetric.getUserMetrics(user_id);
            const metric = metrics.find(m => m.metric_id == id);

            if (!metric) {
                return res.status(404).json({ error: 'Health metric not found' });
            }

            res.json({ metric });
        } catch (error) {
            console.error('Get metric error:', error);
            res.status(500).json({ error: 'Failed to get health metric', details: error.message });
        }
    },

    // Update health metric
    updateHealthMetric: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.user_id;
            const updates = req.body;

            // Validate date if provided
            if (updates.metric_date && !validateDate(updates.metric_date)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            // Validate value if provided
            if (updates.value !== undefined) {
                const valueNum = parseFloat(updates.value);
                if (isNaN(valueNum)) {
                    return res.status(400).json({ error: 'Value must be a number' });
                }
                updates.value = valueNum;
            }

            const success = await HealthMetric.update(id, user_id, updates);

            if (!success) {
                return res.status(404).json({ error: 'Health metric not found or no changes made' });
            }

            res.json({
                message: 'Health metric updated successfully',
                metric_id: id,
                updates
            });
        } catch (error) {
            console.error('Update health metric error:', error);
            res.status(500).json({ error: 'Failed to update health metric', details: error.message });
        }
    },

    // Delete health metric
    deleteHealthMetric: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.user_id;

            const success = await HealthMetric.delete(id, user_id);

            if (!success) {
                return res.status(404).json({ error: 'Health metric not found' });
            }

            res.json({
                message: 'Health metric deleted successfully',
                metric_id: id
            });
        } catch (error) {
            console.error('Delete health metric error:', error);
            res.status(500).json({ error: 'Failed to delete health metric', details: error.message });
        }
    },

    // Search health metrics
    searchHealthMetrics: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const { q } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({ error: 'Search term must be at least 2 characters' });
            }

            const metrics = await HealthMetric.search(user_id, q.trim());

            res.json({
                search_term: q,
                count: metrics.length,
                metrics
            });
        } catch (error) {
            console.error('Search health metrics error:', error);
            res.status(500).json({ error: 'Failed to search health metrics', details: error.message });
        }
    },

    // Get latest metrics
    getLatestMetrics: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const { limit } = req.query;

            const limitNum = limit ? parseInt(limit) : 10;
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({ error: 'Limit must be between 1 and 100' });
            }

            const metrics = await HealthMetric.getLatestMetrics(user_id, limitNum);

            res.json({
                count: metrics.length,
                limit: limitNum,
                metrics
            });
        } catch (error) {
            console.error('Get latest metrics error:', error);
            res.status(500).json({ error: 'Failed to get latest metrics', details: error.message });
        }
    },

    // Get health metric statistics
    getHealthMetricStats: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            const { metric_type } = req.query;

            const stats = await HealthMetric.getStats(user_id, metric_type || null);

            res.json({ stats });
        } catch (error) {
            console.error('Get health metric stats error:', error);
            res.status(500).json({ error: 'Failed to get health metric statistics', details: error.message });
        }
    }
};

module.exports = healthMetricController;
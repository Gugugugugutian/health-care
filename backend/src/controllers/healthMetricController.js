const HealthMetric = require('../models/HealthMetric');
const FamilyGroup = require('../models/FamilyGroup');
const { validateDate } = require('../utils/validators');

// Helper function to convert backend field names to frontend field names
function convertMetricForFrontend(metric) {
    if (!metric) return metric;

    return {
        id: metric.metric_id || metric.id,
        metric_type: metric.metric_type || '',
        metric_value: metric.value !== undefined && metric.value !== null ? metric.value : '',
        recorded_date: metric.metric_date || '',
        unit: metric.unit || '',
        notes: metric.notes || '',
        // Keep original fields for backward compatibility
        ...metric
    };
}

// Helper function to convert array of metrics
function convertMetricsForFrontend(metrics) {
    if (!Array.isArray(metrics)) return metrics;
    return metrics.map(convertMetricForFrontend);
}

const healthMetricController = {
    // Add health metric
    addHealthMetric: async (req, res) => {
        try {
            // Accept both frontend field names (recorded_date, metric_value) and backend field names (metric_date, value)
            const {
                metric_date,
                recorded_date,
                metric_type,
                value,
                metric_value,
                unit,
                notes,
                target_user_id  // For family group admins to add metrics for other members
            } = req.body;
            let user_id = req.user.user_id;

            // If target_user_id is provided, check if current user is a family group admin
            if (target_user_id && target_user_id !== user_id) {
                // Get all family groups where current user is a member
                const userFamilyGroups = await FamilyGroup.getUserFamilyGroups(user_id);
                
                // Check if target user is in any of these family groups and current user is an admin
                let canManage = false;
                for (const group of userFamilyGroups) {
                    if (group.can_manage) {
                        const members = await FamilyGroup.getMembers(group.family_id);
                        const targetMember = members.find(m => m.user_id == target_user_id);
                        if (targetMember) {
                            canManage = true;
                            break;
                        }
                    }
                }

                if (!canManage) {
                    return res.status(403).json({ 
                        error: 'Permission denied',
                        details: 'You can only add health metrics for family group members if you are a group administrator'
                    });
                }

                user_id = target_user_id;
            }

            // Validate inputs
            if (!metric_type || metric_type.trim().length < 2) {
                return res.status(400).json({ error: 'Metric type must be at least 2 characters' });
            }

            // Use recorded_date from frontend if provided, otherwise use metric_date
            const dateToUse = recorded_date || metric_date;
            if (!validateDate(dateToUse)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            // Use metric_value from frontend if provided, otherwise use value
            const valueToUse = metric_value !== undefined ? metric_value : value;
            const valueNum = parseFloat(valueToUse);
            if (isNaN(valueNum)) {
                return res.status(400).json({ error: 'Value must be a number' });
            }

            const metric = await HealthMetric.add({
                user_id,
                metric_date: dateToUse,
                metric_type: metric_type.trim(),
                value: valueNum,
                unit: unit || null,
                notes: notes || null
            });

            res.status(201).json({
                message: 'Health metric added successfully',
                metric: convertMetricForFrontend(metric)
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
                metrics: convertMetricsForFrontend(metrics)
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

            const summaryRows = await HealthMetric.getMonthlySummary(user_id, yearNum, monthNum);

            // Convert array to object with metric_type as key
            const summary = {};
            summaryRows.forEach(row => {
                summary[row.metric_type] = {
                    count: row.count,
                    avg_value: row.avg_value,
                    min_value: row.min_value,
                    max_value: row.max_value,
                    first_date: row.first_date,
                    last_date: row.last_date
                };
            });

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

            res.json({ metric: convertMetricForFrontend(metric) });
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
            let updates = req.body;

            // Handle frontend field names (recorded_date, metric_value) by mapping them to backend field names
            if (updates.recorded_date !== undefined) {
                updates.metric_date = updates.recorded_date;
                delete updates.recorded_date;
            }

            if (updates.metric_value !== undefined) {
                updates.value = updates.metric_value;
                delete updates.metric_value;
            }

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

            // Get the updated metric to return with frontend field names
            const metrics = await HealthMetric.getUserMetrics(user_id);
            const updatedMetric = metrics.find(m => m.metric_id == id);

            res.json({
                message: 'Health metric updated successfully',
                metric_id: id,
                metric: convertMetricForFrontend(updatedMetric),
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
                metrics: convertMetricsForFrontend(metrics)
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
                metrics: convertMetricsForFrontend(metrics)
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
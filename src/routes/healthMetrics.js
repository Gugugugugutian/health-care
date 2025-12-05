const express = require('express');
const router = express.Router();
const healthMetricController = require('../controllers/healthMetricController');
const { auth } = require('../middleware/auth');

// Protected routes
router.post('/', auth, healthMetricController.addHealthMetric);
router.get('/', auth, healthMetricController.getHealthMetrics);
router.get('/stats', auth, healthMetricController.getHealthMetricStats);
router.get('/summary/monthly', auth, healthMetricController.getMonthlySummary);
router.get('/latest', auth, healthMetricController.getLatestMetrics);
router.get('/search', auth, healthMetricController.searchHealthMetrics);
router.get('/:id', auth, healthMetricController.getMetricById);
router.put('/:id', auth, healthMetricController.updateHealthMetric);
router.delete('/:id', auth, healthMetricController.deleteHealthMetric);

module.exports = router;
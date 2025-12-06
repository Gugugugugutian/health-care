const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const providerRoutes = require('./routes/providers');
const appointmentRoutes = require('./routes/appointments');
const challengeRoutes = require('./routes/challenges');
const familyRoutes = require('./routes/family');
const invitationRoutes = require('./routes/invitations');
const healthMetricRoutes = require('./routes/healthMetrics');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/health-metrics', healthMetricRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message || 'Something went wrong'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.warn('Warning: Database connection failed. Some features may not work.');
    }
});

module.exports = app;
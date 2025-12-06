import api from './api';

export const healthMetricService = {
  // Add health metric
  create: async (metricData) => {
    const response = await api.post('/health-metrics', metricData);
    return response.data;
  },

  // Get user's health metrics
  getAll: async () => {
    const response = await api.get('/health-metrics');
    return response.data.metrics || [];
  },

  // Get health metric statistics
  getStats: async () => {
    const response = await api.get('/health-metrics/stats');
    return response.data.stats || {};
  },

  // Get monthly summary
  getMonthlySummary: async (year, month) => {
    const response = await api.get('/health-metrics/summary/monthly', {
      params: { year, month },
    });
    return response.data.summary || {};
  },

  // Get latest metrics
  getLatest: async (limit = 10) => {
    const response = await api.get('/health-metrics/latest', { params: { limit } });
    return response.data.metrics || [];
  },

  // Search health metrics
  search: async (query) => {
    const response = await api.get('/health-metrics/search', { params: { q: query } });
    return response.data.metrics || [];
  },

  // Get metric by ID
  getById: async (id) => {
    const response = await api.get(`/health-metrics/${id}`);
    return response.data;
  },

  // Update health metric
  update: async (id, metricData) => {
    const response = await api.put(`/health-metrics/${id}`, metricData);
    return response.data;
  },

  // Delete health metric
  delete: async (id) => {
    const response = await api.delete(`/health-metrics/${id}`);
    return response.data;
  },
};


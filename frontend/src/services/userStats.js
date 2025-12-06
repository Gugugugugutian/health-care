import api from './api';

export const userStatsService = {
  // Get most active users
  getMostActiveUsers: async (limit = 5) => {
    const response = await api.get('/user-stats/active', { params: { limit } });
    return response.data.users || [];
  },

  // Get user activity statistics
  getUserActivityStats: async () => {
    const response = await api.get('/user-stats/stats');
    return response.data.stats || {};
  }
};
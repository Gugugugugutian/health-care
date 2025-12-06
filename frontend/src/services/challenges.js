import api from './api';

export const challengeService = {
  // Get active challenges
  getActive: async () => {
    const response = await api.get('/challenges/active');
    return response.data.challenges || [];
  },

  // Search challenges
  search: async (query) => {
    const response = await api.get('/challenges/search', { params: { q: query } });
    return response.data.challenges || [];
  },

  // Create new challenge
  create: async (challengeData) => {
    const response = await api.post('/challenges', challengeData);
    return response.data;
  },

  // Get user's challenges
  getAll: async () => {
    const response = await api.get('/challenges');
    return response.data.challenges || [];
  },

  // Get challenge statistics
  getStats: async () => {
    const response = await api.get('/challenges/stats');
    return response.data.stats || {};
  },

  // Get most popular challenges
  getMostPopular: async (limit = 5) => {
    const response = await api.get('/challenges/popular', { params: { limit } });
    return response.data.challenges || [];
  },

  // Get challenge by ID
  getById: async (id) => {
    const response = await api.get(`/challenges/${id}`);
    return response.data;
  },

  // Join challenge
  join: async (id) => {
    const response = await api.post(`/challenges/${id}/join`);
    return response.data;
  },

  // Update progress
  updateProgress: async (id, progress) => {
    const response = await api.put(`/challenges/${id}/progress`, { progress });
    return response.data;
  },

  // Invite to challenge (accepts { email } or { phone })
  invite: async (id, inviteData) => {
    const response = await api.post(`/challenges/${id}/invite`, inviteData);
    return response.data;
  },

  // Delete challenge
  delete: async (id) => {
    const response = await api.delete(`/challenges/${id}`);
    return response.data;
  },

  // Leave challenge
  leave: async (id) => {
    const response = await api.delete(`/challenges/${id}/leave`);
    return response.data;
  },
};


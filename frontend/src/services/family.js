import api from './api';

export const familyService = {
  // Create new family group
  create: async (familyData) => {
    const response = await api.post('/family', familyData);
    return response.data;
  },

  // Get user's family groups
  getAll: async () => {
    const response = await api.get('/family');
    return response.data.family_groups || [];
  },

  // Get family statistics
  getStats: async () => {
    const response = await api.get('/family/stats');
    return response.data.stats || {};
  },

  // Get family group by ID
  getById: async (id) => {
    const response = await api.get(`/family/${id}`);
    return response.data;
  },

  // Add member to family group
  addMember: async (familyId, memberData) => {
    const response = await api.post(`/family/${familyId}/members`, memberData);
    return response.data;
  },

  // Remove member from family group
  removeMember: async (familyId, userId) => {
    const response = await api.delete(`/family/${familyId}/members/${userId}`);
    return response.data;
  },

  // Update member
  updateMember: async (familyId, userId, memberData) => {
    const response = await api.put(`/family/${familyId}/members/${userId}`, memberData);
    return response.data;
  },

  // Invite to family group
  invite: async (familyId, inviteData) => {
    const response = await api.post(`/family/${familyId}/invite`, inviteData);
    return response.data;
  },

  // Delete family group
  delete: async (id) => {
    const response = await api.delete(`/family/${id}`);
    return response.data;
  },
};


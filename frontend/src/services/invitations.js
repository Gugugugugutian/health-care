import api from './api';

export const invitationService = {
  // Get sent invitations
  getSent: async () => {
    const response = await api.get('/invitations');
    return response.data.invitations || [];
  },

  // Get invitations for current user
  getMine: async () => {
    const response = await api.get('/invitations/mine');
    return response.data.invitations || [];
  },

  // Get invitation statistics
  getStats: async () => {
    const response = await api.get('/invitations/stats');
    return response.data.stats || {};
  },

  // Create invitation
  create: async (invitationData) => {
    const response = await api.post('/invitations', invitationData);
    return response.data;
  },

  // Get invitation by UID
  getByUid: async (uid) => {
    const response = await api.get(`/invitations/${uid}`);
    return response.data;
  },

  // Accept invitation
  accept: async (uid) => {
    const response = await api.put(`/invitations/${uid}/accept`);
    return response.data;
  },

  // Cancel invitation
  cancel: async (id) => {
    const response = await api.delete(`/invitations/${id}`);
    return response.data;
  },
};


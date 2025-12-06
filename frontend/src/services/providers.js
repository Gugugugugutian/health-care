import api from './api';

export const providerService = {
  // Get all providers
  getAll: async () => {
    const response = await api.get('/providers');
    return response.data.providers || [];
  },

  // Search providers
  search: async (query) => {
    const response = await api.get('/providers/search', { params: { q: query } });
    return response.data.providers || [];
  },

  // Get provider by ID
  getById: async (id) => {
    const response = await api.get(`/providers/${id}`);
    return response.data;
  },

  // Create new provider
  create: async (providerData) => {
    const response = await api.post('/providers', providerData);
    return response.data;
  },

  // Verify provider
  verify: async (id) => {
    const response = await api.put(`/providers/${id}/verify`);
    return response.data;
  },

  // Link provider to user
  link: async (providerId, isPrimary = false) => {
    const response = await api.post('/providers/link', { provider_id: providerId, is_primary: isPrimary });
    return response.data;
  },

  // Unlink provider from user
  unlink: async (providerId) => {
    const response = await api.delete(`/providers/unlink/${providerId}`);
    return response.data;
  },

  // Get user's providers
  getMine: async () => {
    const response = await api.get('/providers/user/mine');
    return response.data.providers || [];
  },

  // Get user's primary provider
  getPrimary: async () => {
    const response = await api.get('/providers/user/primary');
    return response.data;
  },
};


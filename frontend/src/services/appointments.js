import api from './api';

export const appointmentService = {
  // Create new appointment
  create: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Get user's appointments
  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data.appointments || [];
  },

  // Get appointment statistics
  getStats: async () => {
    const response = await api.get('/appointments/stats');
    return response.data.stats || {};
  },

  // Search appointments by date range
  searchByDate: async (startDate, endDate) => {
    const response = await api.get('/appointments/search/date', {
      params: { start_date: startDate, end_date: endDate },
    });
    return {
      appointments: response.data.appointments || [],
      count: response.data.count || 0,
      totalInDateRange: response.data.total_in_date_range || null,
      startDate: response.data.start_date,
      endDate: response.data.end_date
    };
  },

  // Search appointments with multiple filters
  search: async (filters = {}) => {
    const response = await api.get('/appointments/search', {
      params: filters,
    });
    return {
      appointments: response.data.appointments || [],
      count: response.data.count || 0,
      totalInDateRange: response.data.total_in_date_range || null,
      filters: response.data.filters || {}
    };
  },

  // Get appointment by ID
  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Cancel appointment
  cancel: async (id, reason) => {
    const response = await api.put(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  // Get provider's appointments
  getByProvider: async (providerId) => {
    const response = await api.get(`/appointments/provider/${providerId}`);
    return response.data;
  },
};


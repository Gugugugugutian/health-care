import api from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Add email to user
  addEmail: async (email) => {
    const response = await api.post('/auth/emails', { email });
    return response.data;
  },

  // Verify email
  verifyEmail: async (emailId) => {
    const response = await api.put(`/auth/emails/${emailId}/verify`);
    return response.data;
  },

  // Verify phone
  verifyPhone: async () => {
    const response = await api.put('/auth/phone/verify');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Delete email
  deleteEmail: async (emailId) => {
    const response = await api.delete(`/auth/emails/${emailId}`);
    return response.data;
  },

  // Update phone number
  updatePhone: async (phone) => {
    const response = await api.put('/auth/phone', { phone });
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};


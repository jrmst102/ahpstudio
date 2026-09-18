import api from './api';

let currentUserRequest;

/**
 * Authentication service
 */
const authService = {
  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User data
   */
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    // StrictMode/remounts must not create competing cookie-based sessions.
    if (!currentUserRequest) {
      currentUserRequest = api.get('/auth/me')
        .then(response => response.data)
        .finally(() => { currentUserRequest = null; });
    }
    return currentUserRequest;
  },

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response message
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default authService;

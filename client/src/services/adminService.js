import api from './api';

/**
 * Admin service
 */
const adminService = {
  /**
   * List all users
   * @returns {Promise<Array>} Array of users
   */
  async listUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updates) {
    const response = await api.put(`/admin/users/${userId}`, updates);
    return response.data;
  },

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response message
   */
  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Unlock a user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async unlockUser(userId) {
    const response = await api.post(`/admin/users/${userId}/unlock`);
    return response.data;
  },

  /**
   * Reset user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response message
   */
  async resetPassword(userId, newPassword) {
    const response = await api.post(`/admin/users/${userId}/reset-password`, {
      newPassword,
    });
    return response.data;
  },
};

export default adminService;

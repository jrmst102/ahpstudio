import api from './api';

/**
 * Problem service
 */
const problemService = {
  /**
   * Create a new problem
   * @param {Object} problemData - Problem data
   * @returns {Promise<Object>} Created problem
   */
  async createProblem(problemData) {
    const response = await api.post('/problems', problemData);
    return response.data;
  },

  /**
   * List all problems for current user
   * @returns {Promise<Array>} Array of problems
   */
  async listProblems() {
    const response = await api.get('/problems');
    return response.data;
  },

  /**
   * Get a specific problem
   * @param {string} problemId - Problem ID
   * @returns {Promise<Object>} Problem data
   */
  async getProblem(problemId) {
    const response = await api.get(`/problems/${problemId}`);
    return response.data;
  },

  /**
   * Update a problem
   * @param {string} problemId - Problem ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated problem
   */
  async updateProblem(problemId, updates) {
    const response = await api.put(`/problems/${problemId}`, updates);
    return response.data;
  },

  /**
   * Delete a problem
   * @param {string} problemId - Problem ID
   * @returns {Promise<Object>} Response message
   */
  async deleteProblem(problemId) {
    const response = await api.delete(`/problems/${problemId}`);
    return response.data;
  },

  /**
   * Save problem to .AHP file
   * @param {string} problemId - Problem ID
   * @param {Object} problemData - Complete problem data
   * @returns {Promise<Object>} Response with file key
   */
  async saveProblem(problemId, problemData) {
    const response = await api.post(`/problems/${problemId}/save`, problemData);
    return response.data;
  },

  /**
   * Download problem file
   * @param {string} problemId - Problem ID
   * @returns {Promise<string>} Download URL
   */
  async downloadProblem(problemId) {
    const response = await api.get(`/problems/${problemId}/download`);
    return response.data;
  },

  /**
   * Upload and import problem file
   * @param {Object} problemData - Problem data from .AHP file
   * @returns {Promise<Object>} Imported problem
   */
  async uploadProblem(problemData) {
    const response = await api.post('/problems/upload', { problemData });
    return response.data;
  },
};

export default problemService;

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

  // ── Participant management ──

  async listParticipants(problemId) {
    const response = await api.get(`/problems/${problemId}/participants`);
    return response.data;
  },

  async addParticipant(problemId, { name, email }) {
    const response = await api.post(`/problems/${problemId}/participants`, { name, email });
    return response.data;
  },

  async updateParticipant(problemId, participantId, updates) {
    const response = await api.put(`/problems/${problemId}/participants/${participantId}`, updates);
    return response.data;
  },

  async removeParticipant(problemId, participantId) {
    const response = await api.delete(`/problems/${problemId}/participants/${participantId}`);
    return response.data;
  },

  async regeneratePin(problemId, participantId) {
    const response = await api.post(`/problems/${problemId}/participants/${participantId}/regenerate-pin`);
    return response.data;
  },

  // ── Config ──

  async updateConfig(problemId, config) {
    const response = await api.put(`/problems/${problemId}/config`, config);
    return response.data;
  },

  // ── Round management ──

  async closeRound(problemId) {
    const response = await api.post(`/problems/${problemId}/round/close`);
    return response.data;
  },

  async reopenRound(problemId) {
    const response = await api.post(`/problems/${problemId}/round/reopen`);
    return response.data;
  },

  async newRound(problemId) {
    const response = await api.post(`/problems/${problemId}/round/new`);
    return response.data;
  },

  async finalizeProblem(problemId) {
    const response = await api.post(`/problems/${problemId}/finalize`);
    return response.data;
  },

  // ── Consensus & rounds ──

  async getConsensus(problemId) {
    const response = await api.get(`/problems/${problemId}/consensus`);
    return response.data;
  },

  async listRounds(problemId) {
    const response = await api.get(`/problems/${problemId}/rounds`);
    return response.data;
  },

  // ── Aggregate results from participant submissions ──

  async getAggregateResults(problemId) {
    const response = await api.get(`/problems/${problemId}/aggregate-results`);
    return response.data;
  },
};

export default problemService;

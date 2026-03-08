import api from './api';

/**
 * AHP computation service
 */
const computeService = {
  /**
   * Compute priorities from pairwise comparison matrix
   * @param {Array<Array<number>>} matrix - Comparison matrix
   * @returns {Promise<Object>} Priorities and consistency metrics
   */
  async computePriorities(matrix) {
    const response = await api.post('/compute/priorities', { matrix });
    return response.data;
  },

  /**
   * Compute consistency metrics
   * @param {Array<Array<number>>} matrix - Comparison matrix
   * @returns {Promise<Object>} Consistency metrics (CI, CR, lambdaMax)
   */
  async computeConsistency(matrix) {
    const response = await api.post('/compute/consistency', { matrix });
    return response.data;
  },

  /**
   * Synthesize global priorities
   * @param {Object} criteriaWeights - Criteria weights
   * @param {Object} alternativePriorities - Alternative priorities per criterion
   * @returns {Promise<Object>} Global priorities (normalized and idealized)
   */
  async synthesize(criteriaWeights, alternativePriorities) {
    const response = await api.post('/compute/synthesize', {
      criteriaWeights,
      alternativePriorities,
    });
    return response.data;
  },

  /**
   * Perform sensitivity analysis
   * @param {Object} criteriaWeights - Criteria weights
   * @param {Object} alternativePriorities - Alternative priorities per criterion
   * @param {string} targetCriterion - Criterion to analyze
   * @param {number} weightRange - Number of data points (default: 20)
   * @returns {Promise<Object>} Sensitivity analysis data
   */
  async sensitivityAnalysis(criteriaWeights, alternativePriorities, targetCriterion, weightRange = 20) {
    const response = await api.post('/compute/sensitivity', {
      criteriaWeights,
      alternativePriorities,
      targetCriterion,
      weightRange,
    });
    return response.data;
  },

  /**
   * Aggregate multiple comparison matrices with weighted geometric mean
   * @param {Array<Array<Array<number>>>} matrices - Array of comparison matrices
   * @param {Array<number>} weights - Respondent weights
   * @returns {Promise<Object>} Aggregated matrix and priorities
   */
  async aggregateMatrices(matrices, weights) {
    const response = await api.post('/compute/aggregate', { matrices, weights });
    return response.data;
  },
};

export default computeService;

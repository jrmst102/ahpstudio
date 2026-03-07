const { create, all } = require('mathjs');

const math = create(all);

/**
 * AHP Engine - Implements Saaty's Analytic Hierarchy Process
 * Including eigenvector method for priority derivation and consistency checking
 */

// Saaty's Random Consistency Index (RI) table
const RI_TABLE = {
  1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
  11: 1.51, 12: 1.48
};

/**
 * Compute the principal eigenvector using the power method
 * @param {Array<Array<number>>} matrix - Pairwise comparison matrix
 * @param {number} tolerance - Convergence tolerance (default: 1e-6)
 * @param {number} maxIterations - Maximum iterations (default: 1000)
 * @returns {Array<number>} Normalized priority vector
 */
function computeEigenvector(matrix, tolerance = 1e-6, maxIterations = 1000) {
  const n = matrix.length;
  
  if (n === 0) {
    throw new Error('Matrix cannot be empty');
  }
  
  if (n === 1) {
    return [1.0];
  }
  
  // Initialize with uniform vector
  let vector = Array(n).fill(1.0 / n);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Multiply matrix by vector
    const newVector = matrix.map(row =>
      row.reduce((sum, val, j) => sum + val * vector[j], 0)
    );
    
    // Normalize
    const sum = newVector.reduce((a, b) => a + b, 0);
    const normalized = newVector.map(v => v / sum);
    
    // Check convergence
    const maxDiff = Math.max(...normalized.map((val, i) => Math.abs(val - vector[i])));
    
    if (maxDiff < tolerance) {
      return normalized;
    }
    
    vector = normalized;
  }
  
  // Return result even if not fully converged
  console.warn(`Eigenvector computation did not fully converge after ${maxIterations} iterations`);
  return vector;
}

/**
 * Compute the maximum eigenvalue (lambda_max)
 * @param {Array<Array<number>>} matrix - Pairwise comparison matrix
 * @param {Array<number>} priorityVector - Priority vector
 * @returns {number} Maximum eigenvalue
 */
function computeLambdaMax(matrix, priorityVector) {
  const n = matrix.length;
  
  if (n === 1) {
    return 1.0;
  }
  
  // Compute weighted sum vector
  const weightedSum = matrix.map(row =>
    row.reduce((sum, val, j) => sum + val * priorityVector[j], 0)
  );
  
  // Compute lambda_max as average of (weighted sum / priority)
  const lambdaValues = weightedSum.map((ws, i) => ws / priorityVector[i]);
  return lambdaValues.reduce((a, b) => a + b, 0) / n;
}

/**
 * Compute Consistency Index (CI)
 * @param {number} lambdaMax - Maximum eigenvalue
 * @param {number} n - Matrix dimension
 * @returns {number} Consistency Index
 */
function computeCI(lambdaMax, n) {
  if (n <= 1) {
    return 0;
  }
  return (lambdaMax - n) / (n - 1);
}

/**
 * Compute Consistency Ratio (CR)
 * @param {number} ci - Consistency Index
 * @param {number} n - Matrix dimension
 * @returns {number} Consistency Ratio
 */
function computeCR(ci, n) {
  const ri = RI_TABLE[n] || 1.48;
  if (ri === 0) {
    return 0;
  }
  return ci / ri;
}

/**
 * Compute priorities from a pairwise comparison matrix
 * @param {Array<Array<number>>} matrix - Pairwise comparison matrix
 * @returns {Object} Priority vector and consistency metrics
 */
function computePriorities(matrix) {
  const n = matrix.length;
  
  // Validate matrix
  if (!validateMatrix(matrix)) {
    throw new Error('Invalid pairwise comparison matrix');
  }
  
  // Compute priority vector
  const priorityVector = computeEigenvector(matrix);
  
  // Compute consistency metrics
  const lambdaMax = computeLambdaMax(matrix, priorityVector);
  const ci = computeCI(lambdaMax, n);
  const cr = computeCR(ci, n);
  
  return {
    priorities: priorityVector,
    lambdaMax,
    ci,
    cr,
    isConsistent: cr <= 0.10,
  };
}

/**
 * Validate that a matrix is a valid pairwise comparison matrix
 * @param {Array<Array<number>>} matrix - Matrix to validate
 * @returns {boolean} True if valid
 */
function validateMatrix(matrix) {
  const n = matrix.length;
  
  if (n === 0) {
    return false;
  }
  
  // Check if square
  if (!matrix.every(row => row.length === n)) {
    return false;
  }
  
  // Check diagonal is all 1s
  for (let i = 0; i < n; i++) {
    if (Math.abs(matrix[i][i] - 1.0) > 1e-6) {
      return false;
    }
  }
  
  // Check reciprocal property
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matrix[i][j] * matrix[j][i] - 1.0) > 1e-6) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Synthesize global priorities using distributive mode
 * @param {Object} criteriaWeights - Criteria priority weights
 * @param {Object} alternativePriorities - Alternative priorities for each criterion
 * @returns {Object} Global priorities (normalized and idealized)
 */
function synthesize(criteriaWeights, alternativePriorities) {
  const alternatives = Object.keys(alternativePriorities[Object.keys(alternativePriorities)[0]]);
  const criteria = Object.keys(criteriaWeights);
  
  const globalPriorities = {};
  
  // Initialize all alternatives to 0
  alternatives.forEach(alt => {
    globalPriorities[alt] = 0;
  });
  
  // Compute weighted sum for each alternative
  criteria.forEach(criterion => {
    const weight = criteriaWeights[criterion];
    const localPriorities = alternativePriorities[criterion];
    
    alternatives.forEach(alt => {
      globalPriorities[alt] += weight * (localPriorities[alt] || 0);
    });
  });
  
  // Find max for idealized mode
  const maxPriority = Math.max(...Object.values(globalPriorities));
  
  // Create idealized priorities
  const idealized = {};
  alternatives.forEach(alt => {
    idealized[alt] = maxPriority > 0 ? globalPriorities[alt] / maxPriority : 0;
  });
  
  return {
    normalized: globalPriorities,
    idealized,
  };
}

/**
 * Create an identity pairwise comparison matrix
 * @param {number} n - Matrix dimension
 * @returns {Array<Array<number>>} Identity matrix
 */
function createIdentityMatrix(n) {
  return Array(n).fill(0).map((_, i) =>
    Array(n).fill(0).map((_, j) => (i === j ? 1.0 : 1.0))
  );
}

/**
 * Update a pairwise comparison matrix with a new comparison
 * @param {Array<Array<number>>} matrix - Current matrix
 * @param {number} i - First element index
 * @param {number} j - Second element index
 * @param {number} value - Comparison value (1-9 scale)
 * @returns {Array<Array<number>>} Updated matrix
 */
function updateMatrix(matrix, i, j, value) {
  const newMatrix = matrix.map(row => [...row]);
  newMatrix[i][j] = value;
  newMatrix[j][i] = 1.0 / value;
  return newMatrix;
}

module.exports = {
  computePriorities,
  computeEigenvector,
  computeLambdaMax,
  computeCI,
  computeCR,
  synthesize,
  validateMatrix,
  createIdentityMatrix,
  updateMatrix,
  RI_TABLE,
};

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

/**
 * Aggregate multiple pairwise comparison matrices using the weighted geometric mean.
 * Each cell: aggregated[i][j] = ∏( matrices[k][i][j] ^ normalizedWeights[k] )
 * @param {Array<Array<Array<number>>>} matrices - Array of comparison matrices
 * @param {Array<number>} weights - Participant weights (will be normalised internally)
 * @returns {Array<Array<number>>} Aggregated matrix
 */
function aggregateMatrices(matrices, weights) {
  if (!matrices || matrices.length === 0) {
    throw new Error('At least one matrix is required for aggregation');
  }
  if (matrices.length === 1) return matrices[0].map(row => [...row]);

  const n = matrices[0].length;
  const totalW = weights.reduce((a, b) => a + b, 0);
  const normW = weights.map(w => w / totalW);

  const result = Array.from({ length: n }, () => Array(n).fill(1));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) { result[i][j] = 1; continue; }
      let product = 1;
      for (let k = 0; k < matrices.length; k++) {
        const val = matrices[k]?.[i]?.[j] || 1;
        product *= Math.pow(val, normW[k]);
      }
      result[i][j] = product;
    }
  }
  return result;
}

/**
 * Compute Kendall's coefficient of concordance (W) across multiple rankers.
 * Each row of `rankings` is one ranker's ranking vector (lower = better rank).
 * @param {Array<Array<number>>} rankings - k × n matrix (k rankers, n items)
 * @returns {{ W: number, chiSquared: number, pValue: number, k: number, n: number }}
 */
function computeKendallW(rankings) {
  const k = rankings.length; // number of rankers
  if (k < 2) return { W: 1, chiSquared: 0, pValue: 1, k, n: rankings[0]?.length || 0 };
  const n = rankings[0].length; // number of items
  if (n < 2) return { W: 1, chiSquared: 0, pValue: 1, k, n };

  // Compute column sums of ranks
  const Rj = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < k; i++) {
      Rj[j] += rankings[i][j];
    }
  }

  const meanR = k * (n + 1) / 2;

  // S = sum of squared deviations of column totals from their mean
  let S = 0;
  for (let j = 0; j < n; j++) {
    S += (Rj[j] - meanR) * (Rj[j] - meanR);
  }

  // W = 12S / (k^2 * (n^3 - n))
  const W = (12 * S) / (k * k * (n * n * n - n));
  const clampedW = Math.max(0, Math.min(1, W));

  // Chi-squared approximation: χ² = k(n-1)W
  const chiSquared = k * (n - 1) * clampedW;
  const df = n - 1;

  // Approximate p-value using Wilson-Hilferty chi-squared approximation
  const pValue = approxChiSquaredPValue(chiSquared, df);

  return { W: clampedW, chiSquared, pValue, k, n };
}

/**
 * Approximate upper-tail p-value for chi-squared distribution
 * using the Wilson-Hilferty normal approximation.
 */
function approxChiSquaredPValue(chiSq, df) {
  if (df <= 0) return 1;
  if (chiSq <= 0) return 1;
  // Wilson-Hilferty transformation: Z = ((chi²/df)^(1/3) - (1 - 2/(9*df))) / sqrt(2/(9*df))
  const k = 2 / (9 * df);
  const z = Math.pow(chiSq / df, 1 / 3) - (1 - k);
  const denom = Math.sqrt(k);
  if (denom === 0) return chiSq > df ? 0 : 1;
  const Z = z / denom;
  // Standard normal CDF approximation (Abramowitz & Stegun)
  return 1 - normalCDF(Z);
}

function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}

/**
 * Convert priority vectors to rank vectors for Kendall's W computation.
 * Higher priority → lower rank (rank 1 = best).
 * Handles tied ranks by assigning average rank.
 * @param {Array<Array<number>>} priorityVectors - k × n matrix
 * @returns {Array<Array<number>>} k × n rank matrix
 */
function prioritiesToRanks(priorityVectors) {
  return priorityVectors.map(pv => {
    const indexed = pv.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => b.v - a.v); // descending priority
    const ranks = Array(pv.length);
    let r = 1;
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      // Find ties
      while (j < indexed.length && Math.abs(indexed[j].v - indexed[i].v) < 1e-10) j++;
      const avgRank = (r + r + (j - i - 1)) / 2;
      for (let k = i; k < j; k++) ranks[indexed[k].i] = avgRank;
      r += (j - i);
      i = j;
    }
    return ranks;
  });
}

/**
 * Find the most inconsistent triad in a pairwise comparison matrix.
 * Uses circular inconsistency: deviation = |log(a_ij) + log(a_jk) - log(a_ik)|
 * @param {Array<Array<number>>} matrix - n×n comparison matrix
 * @returns {{ indices: [number, number, number], deviation: number } | null}
 */
function findMostInconsistentTriad(matrix) {
  const n = matrix.length;
  if (n < 3) return null;

  let maxDeviation = -1;
  let bestTriad = null;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const aij = matrix[i][j];
        const ajk = matrix[j][k];
        const aik = matrix[i][k];

        if (aij <= 0 || ajk <= 0 || aik <= 0) continue;

        const deviation = Math.abs(Math.log(aij) + Math.log(ajk) - Math.log(aik));
        if (deviation > maxDeviation) {
          maxDeviation = deviation;
          bestTriad = [i, j, k];
        }
      }
    }
  }

  if (!bestTriad) return null;
  return { indices: bestTriad, deviation: maxDeviation };
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
  aggregateMatrices,
  computeKendallW,
  prioritiesToRanks,
  findMostInconsistentTriad,
  RI_TABLE,
};

/**
 * Matrix utility functions for AHP calculations
 */

/**
 * Check if matrix is square
 * @param {Array<Array<number>>} matrix - Matrix to check
 * @returns {boolean} True if square
 */
function isSquare(matrix) {
  if (!matrix || matrix.length === 0) return false;
  const n = matrix.length;
  return matrix.every(row => row.length === n);
}

/**
 * Transpose a matrix
 * @param {Array<Array<number>>} matrix - Matrix to transpose
 * @returns {Array<Array<number>>} Transposed matrix
 */
function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/**
 * Multiply matrix by vector
 * @param {Array<Array<number>>} matrix - Matrix
 * @param {Array<number>} vector - Vector
 * @returns {Array<number>} Result vector
 */
function multiplyMatrixVector(matrix, vector) {
  return matrix.map(row =>
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}

/**
 * Multiply two matrices
 * @param {Array<Array<number>>} a - First matrix
 * @param {Array<Array<number>>} b - Second matrix
 * @returns {Array<Array<number>>} Product matrix
 */
function multiplyMatrices(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Normalize a vector (make sum = 1)
 * @param {Array<number>} vector - Vector to normalize
 * @returns {Array<number>} Normalized vector
 */
function normalize(vector) {
  const sum = vector.reduce((a, b) => a + b, 0);
  return sum === 0 ? vector : vector.map(v => v / sum);
}

/**
 * Calculate vector magnitude (Euclidean norm)
 * @param {Array<number>} vector - Vector
 * @returns {number} Magnitude
 */
function magnitude(vector) {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

/**
 * Print matrix to console (for debugging)
 * @param {Array<Array<number>>} matrix - Matrix to print
 * @param {number} precision - Decimal places (default: 4)
 */
function printMatrix(matrix, precision = 4) {
  matrix.forEach(row => {
    console.log(row.map(val => val.toFixed(precision)).join('  '));
  });
}

module.exports = {
  isSquare,
  transpose,
  multiplyMatrixVector,
  multiplyMatrices,
  normalize,
  magnitude,
  printMatrix,
};

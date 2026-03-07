const ahpEngine = require('../src/services/ahpEngine');

describe('AHP Engine Tests', () => {
  describe('Eigenvector Computation', () => {
    test('should compute eigenvector for 3x3 consistent matrix', () => {
      // Example from Saaty's book - perfectly consistent matrix
      const matrix = [
        [1, 3, 5],
        [1/3, 1, 3],
        [1/5, 1/3, 1],
      ];
      
      const result = ahpEngine.computePriorities(matrix);
      
      // Priorities should sum to 1
      const sum = result.priorities.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 6);
      
      // For perfectly consistent matrix, CR should be 0
      expect(result.cr).toBeCloseTo(0, 2);
      expect(result.isConsistent).toBe(true);
    });

    test('should compute eigenvector for identity matrix', () => {
      const matrix = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      
      const result = ahpEngine.computePriorities(matrix);
      
      // All priorities should be equal (approximately 0.333)
      result.priorities.forEach(priority => {
        expect(priority).toBeCloseTo(1/3, 2);
      });
    });

    test('should handle single element matrix', () => {
      const matrix = [[1]];
      
      const result = ahpEngine.computePriorities(matrix);
      
      expect(result.priorities).toEqual([1.0]);
      expect(result.cr).toBe(0);
      expect(result.isConsistent).toBe(true);
    });
  });

  describe('Consistency Checking', () => {
    test('should identify inconsistent matrix', () => {
      // Deliberately inconsistent matrix
      const matrix = [
        [1, 5, 9],
        [1/5, 1, 2],
        [1/9, 1/2, 1],
      ];
      
      const result = ahpEngine.computePriorities(matrix);
      
      // This matrix should have CR > 0.10
      expect(result.cr).toBeGreaterThan(0.10);
      expect(result.isConsistent).toBe(false);
    });

    test('should validate reciprocal property', () => {
      const validMatrix = [
        [1, 3, 5],
        [1/3, 1, 2],
        [1/5, 1/2, 1],
      ];
      
      expect(ahpEngine.validateMatrix(validMatrix)).toBe(true);
      
      // Invalid matrix - not reciprocal
      const invalidMatrix = [
        [1, 3, 5],
        [1/2, 1, 2],  // Should be 1/3, not 1/2
        [1/5, 1/2, 1],
      ];
      
      expect(ahpEngine.validateMatrix(invalidMatrix)).toBe(false);
    });
  });

  describe('Synthesis', () => {
    test('should synthesize global priorities correctly', () => {
      const criteriaWeights = {
        cost: 0.7,
        quality: 0.3,
      };
      
      const alternativePriorities = {
        cost: {
          optionA: 0.6,
          optionB: 0.4,
        },
        quality: {
          optionA: 0.3,
          optionB: 0.7,
        },
      };
      
      const result = ahpEngine.synthesize(criteriaWeights, alternativePriorities);
      
      // Check normalized priorities
      expect(result.normalized.optionA).toBeCloseTo(0.7 * 0.6 + 0.3 * 0.3, 6);
      expect(result.normalized.optionB).toBeCloseTo(0.7 * 0.4 + 0.3 * 0.7, 6);
      
      // Check that priorities sum to 1
      const sum = result.normalized.optionA + result.normalized.optionB;
      expect(sum).toBeCloseTo(1.0, 6);
    });
  });

  describe('Matrix Operations', () => {
    test('should create identity matrix', () => {
      const matrix = ahpEngine.createIdentityMatrix(3);
      
      expect(matrix).toEqual([
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]);
    });

    test('should update matrix with reciprocal', () => {
      const matrix = ahpEngine.createIdentityMatrix(3);
      const updated = ahpEngine.updateMatrix(matrix, 0, 1, 5);
      
      expect(updated[0][1]).toBe(5);
      expect(updated[1][0]).toBeCloseTo(1/5, 6);
      expect(updated[0][0]).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle maximum size matrix (12x12)', () => {
      const n = 12;
      const matrix = Array(n).fill(0).map((_, i) =>
        Array(n).fill(0).map((_, j) => (i === j ? 1 : (i < j ? 2 : 0.5)))
      );
      
      const result = ahpEngine.computePriorities(matrix);
      
      expect(result.priorities).toHaveLength(n);
      const sum = result.priorities.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    test('should handle 2x2 matrix', () => {
      const matrix = [
        [1, 3],
        [1/3, 1],
      ];
      
      const result = ahpEngine.computePriorities(matrix);
      
      expect(result.priorities).toHaveLength(2);
      expect(result.priorities[0]).toBeCloseTo(0.75, 2);
      expect(result.priorities[1]).toBeCloseTo(0.25, 2);
    });
  });
});

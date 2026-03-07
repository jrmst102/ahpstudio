// Development script to test AHP engine locally
const ahpEngine = require('./src/services/ahpEngine');

console.log('='.repeat(50));
console.log('AHP Engine Development Test');
console.log('='.repeat(50));
console.log('');

// Test 1: Simple 3x3 matrix
console.log('Test 1: Computing priorities for a 3x3 matrix');
console.log('-'.repeat(50));

const matrix1 = [
  [1, 3, 5],
  [1/3, 1, 3],
  [1/5, 1/3, 1],
];

console.log('Input matrix:');
matrix1.forEach(row => console.log(row.map(v => v.toFixed(3)).join('  ')));
console.log('');

const result1 = ahpEngine.computePriorities(matrix1);
console.log('Results:');
console.log('  Priorities:', result1.priorities.map(p => p.toFixed(4)));
console.log('  Lambda Max:', result1.lambdaMax.toFixed(6));
console.log('  CI:', result1.ci.toFixed(6));
console.log('  CR:', result1.cr.toFixed(6));
console.log('  Consistent:', result1.isConsistent ? 'Yes' : 'No');
console.log('');

// Test 2: Synthesis
console.log('Test 2: Synthesizing global priorities');
console.log('-'.repeat(50));

const criteriaWeights = {
  cost: 0.6,
  quality: 0.3,
  time: 0.1,
};

const alternativePriorities = {
  cost: {
    'Option A': 0.5,
    'Option B': 0.3,
    'Option C': 0.2,
  },
  quality: {
    'Option A': 0.2,
    'Option B': 0.5,
    'Option C': 0.3,
  },
  time: {
    'Option A': 0.4,
    'Option B': 0.4,
    'Option C': 0.2,
  },
};

const result2 = ahpEngine.synthesize(criteriaWeights, alternativePriorities);

console.log('Criteria Weights:');
Object.entries(criteriaWeights).forEach(([key, val]) => {
  console.log(`  ${key}: ${(val * 100).toFixed(1)}%`);
});
console.log('');

console.log('Global Priorities (Normalized):');
Object.entries(result2.normalized).forEach(([key, val]) => {
  console.log(`  ${key}: ${(val * 100).toFixed(2)}%`);
});
console.log('');

console.log('Global Priorities (Idealized):');
Object.entries(result2.idealized).forEach(([key, val]) => {
  console.log(`  ${key}: ${val.toFixed(4)}`);
});
console.log('');

console.log('='.repeat(50));
console.log('Tests completed successfully!');
console.log('='.repeat(50));

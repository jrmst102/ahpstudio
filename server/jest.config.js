module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
  ],
  coverageThreshold: {
    global: {
      branches: 3,
      functions: 10,
      lines: 5,
      statements: 5,
    },
  },
};

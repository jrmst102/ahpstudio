module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/prisma/',
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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

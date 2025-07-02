module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/main/**/*.test.js',
    '**/test/**/*.test.js'
  ],
  collectCoverageFrom: [
    'main/**/*.js',
    '!main/index.js', // Exclude main entry point
    '!**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  // CI environment settings
  ...(process.env.CI && {
    ci: true,
    coverageReporters: ['text', 'lcov', 'html'],
    maxWorkers: 2
  })
};
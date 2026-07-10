module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/prisma/',
    '/logs/',
    '/tests/'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/scripts/**',
    '!src/sockets/**',
    '!src/config/scheduler.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};

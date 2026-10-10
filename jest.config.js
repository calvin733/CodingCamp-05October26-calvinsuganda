module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/browser/'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js'
  ],
  verbose: true
};

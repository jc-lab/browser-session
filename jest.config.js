const path = require('path');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coverageReporters: [
    'html',
    'cobertura'
  ],
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  globals: {
    'ts-jest': {
      babel: true,
      tsconfig: 'test/tsconfig.json'
    }
  },
  verbose: true
};


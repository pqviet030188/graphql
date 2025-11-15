module.exports = {
  preset: "ts-jest",
  verbose: true,
  testEnvironment: "node",
  // teardown script to clean up after tests
  globalTeardown: "<rootDir>/tests/globalTeardown.ts",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};

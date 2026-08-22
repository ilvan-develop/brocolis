module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@brocolis/.*)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@brocolis/(.*)$": "<rootDir>/../packages/$1/src",
  },
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  // apps/mobile é ainda um scaffold (F5/v2 fora do milestone MVP_V1);
  // sem testes próprios até lá, o gate `test:unit` não deve reprovar por isso.
  passWithNoTests: true,
};

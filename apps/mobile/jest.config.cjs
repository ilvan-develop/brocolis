module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    // pnpm guarda os pacotes em node_modules/.pnpm/<pkg>@<versao>/node_modules/<pkg>;
    // sem o ".pnpm" na lista de exceções, o primeiro "node_modules/" já
    // corresponderia ao lookahead negativo (o que se segue é ".pnpm/...",
    // que não bate com nenhuma das exceções) e o ficheiro seria ignorado
    // antes de o regex chegar ao nome do pacote real.
    "node_modules/(?!\\.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@brocolis/.*)",
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

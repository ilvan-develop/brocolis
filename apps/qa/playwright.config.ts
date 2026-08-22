import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: "pnpm --filter web build && pnpm --filter web start",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});

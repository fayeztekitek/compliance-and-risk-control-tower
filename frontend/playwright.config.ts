import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node node_modules/vite/bin/vite.js --port 5173",
      port: 5173,
      reuseExistingServer: true,
      cwd: ".",
    },
    {
      command: "node node_modules/tsx/cli.mjs src/index.ts",
      port: 3001,
      reuseExistingServer: true,
      cwd: "../backend",
      env: { PORT: "3001" },
    },
  ],
});

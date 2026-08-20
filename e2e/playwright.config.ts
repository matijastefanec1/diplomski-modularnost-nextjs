import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

const targets = {
  a: {
    packageName: "@splitscore/variant-a",
    port: 3101,
  },
  b: {
    packageName: "@splitscore/variant-b",
    port: 3102,
  },
} as const;

const targetVariant = process.env.TARGET_VARIANT;

if (targetVariant !== "a" && targetVariant !== "b") {
  throw new Error("TARGET_VARIANT mora biti 'a' ili 'b'.");
}

const target = targets[targetVariant];
const workspaceRoot = path.resolve(import.meta.dirname, "..");
const baseURL = `http://127.0.0.1:${target.port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: `chromium-${targetVariant}`,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm --filter ${target.packageName} exec next dev --hostname 127.0.0.1 --port ${target.port}`,
    cwd: workspaceRoot,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/application/decide-match.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/application/use-cases/decide-match.ts"],
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage/evaluation-status",
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 90,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});

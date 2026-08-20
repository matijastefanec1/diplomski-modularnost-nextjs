import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/domain/activity-window.test.ts",
      "tests/unit/domain/points.test.ts",
      "tests/unit/domain/decision-deadline.test.ts",
      "tests/unit/domain/match-result.test.ts",
      "tests/unit/domain/set-perspective.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/domain/scoring/activity-window.ts",
        "src/domain/scoring/points.ts",
        "src/domain/match/decision-deadline.ts",
        "src/domain/match/match-result.ts",
        "src/domain/match/set-perspective.ts",
      ],
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage/evaluation-domain",
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});

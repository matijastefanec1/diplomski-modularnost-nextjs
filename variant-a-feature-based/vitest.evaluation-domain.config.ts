import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "features/scoring/lib/activity-window.test.ts",
      "features/scoring/lib/points.test.ts",
      "features/matches/lib/decision-deadline.test.ts",
      "features/matches/lib/match-result.test.ts",
      "features/matches/lib/set-perspective.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: [
        "features/scoring/lib/activity-window.ts",
        "features/scoring/lib/points.ts",
        "features/matches/lib/decision-deadline.ts",
        "features/matches/lib/match-result.ts",
        "features/matches/lib/set-perspective.ts",
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

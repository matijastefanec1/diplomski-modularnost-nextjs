import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/match-decision.test.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://splitscore:splitscore@localhost:5432/splitscore_a?schema=public",
    },
    coverage: {
      provider: "v8",
      include: ["features/matches/actions/decide-match.ts"],
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

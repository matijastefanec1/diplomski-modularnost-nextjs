import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://splitscore:splitscore@localhost:5432/splitscore_a?schema=public",
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});

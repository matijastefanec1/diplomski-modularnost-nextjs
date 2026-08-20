import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    server: { deps: { inline: ["next-auth"] } },
    include: ["tests/integration/**/*.test.ts"],
    // testovi dijele istu bazu, a rang-lista čita sve igrače - jedna datoteka odjednom
    fileParallelism: false,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://splitscore:splitscore@localhost:5432/splitscore_b?schema=public",
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});

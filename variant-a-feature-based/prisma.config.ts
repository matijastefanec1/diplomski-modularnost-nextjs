import "dotenv/config";

import { defineConfig } from "prisma/config";

const developmentDatabaseUrl =
  "postgresql://splitscore:splitscore@localhost:5432/splitscore_a?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? developmentDatabaseUrl,
  },
});

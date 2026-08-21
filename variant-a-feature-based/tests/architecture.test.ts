import path from "node:path";

import { ESLint } from "eslint";
import { describe, it, expect } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const fixtureRoot = path.join(
  projectRoot,
  "tests",
  "architecture-fixtures",
  "project",
);

async function ruleIdsFor(relativePath: string) {
  const eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: path.join(projectRoot, "eslint.config.mjs"),
  });
  const [result] = await eslint.lintFiles([path.join(fixtureRoot, relativePath)]);

  return result.messages.map((message) => message.ruleId);
}

describe("variant A architecture boundaries", () => {
  it("rejects a deep feature import from app", async () => {
    await expect(ruleIdsFor("app/deep-import.ts")).resolves.toContain(
      "boundaries/dependencies",
    );
  });

  it("accepts an app route composing two features through their indexes", async () => {
    await expect(ruleIdsFor("app/imports-features.ts")).resolves.not.toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects a deep feature import from app through the alias", async () => {
    await expect(ruleIdsFor("app/deep-import-alias.ts")).resolves.toContain(
      "no-restricted-imports",
    );
  });

  it("rejects app importing the generated Prisma client", async () => {
    await expect(ruleIdsFor("app/imports-prisma.ts")).resolves.toContain(
      "no-restricted-imports",
    );
  });

  it("rejects app relatively importing the generated Prisma client", async () => {
    await expect(
      ruleIdsFor("app/imports-prisma-relative.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects shared importing a feature", async () => {
    await expect(ruleIdsFor("shared/imports-feature.ts")).resolves.toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects shared importing a feature through the alias", async () => {
    await expect(
      ruleIdsFor("shared/imports-feature-alias.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects scoring importing matches", async () => {
    await expect(
      ruleIdsFor("features/scoring/imports-matches.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });

  it("rejects matches importing players", async () => {
    await expect(
      ruleIdsFor("features/matches/imports-players.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });

  it("rejects players importing matches", async () => {
    await expect(
      ruleIdsFor("features/players/imports-matches.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });

  it("accepts players importing auth through its index", async () => {
    await expect(
      ruleIdsFor("features/players/imports-auth.ts"),
    ).resolves.not.toContain("boundaries/dependencies");
  });

  it("accepts matches importing auth through its index", async () => {
    await expect(
      ruleIdsFor("features/matches/imports-auth.ts"),
    ).resolves.not.toContain("boundaries/dependencies");
  });

  it("rejects matches deep-importing auth", async () => {
    await expect(
      ruleIdsFor("features/matches/imports-auth-deep.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });

  it("rejects auth importing players", async () => {
    await expect(
      ruleIdsFor("features/auth/imports-players.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });

  it("rejects players deep-importing auth", async () => {
    await expect(
      ruleIdsFor("features/players/imports-auth-deep.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });

  it("rejects a deep feature import through the alias", async () => {
    await expect(
      ruleIdsFor("features/players/imports-scoring-deep-alias.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects the scoring lib module importing the generated Prisma client", async () => {
    await expect(
      ruleIdsFor("features/scoring/lib/imports-prisma.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects the scoring lib module relatively importing the generated Prisma client", async () => {
    await expect(
      ruleIdsFor("features/scoring/lib/imports-prisma-relative.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects the matches lib module importing Next.js", async () => {
    await expect(
      ruleIdsFor("features/matches/lib/imports-next.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects the matches lib module importing Auth.js", async () => {
    await expect(
      ruleIdsFor("features/matches/lib/imports-next-auth.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects the matches lib module importing the shared Prisma adapter through the alias", async () => {
    await expect(
      ruleIdsFor("features/matches/lib/imports-shared-prisma-alias.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects the matches lib module relatively importing the shared Prisma adapter", async () => {
    await expect(
      ruleIdsFor("features/matches/lib/imports-shared-prisma-relative.ts"),
    ).resolves.toContain("no-restricted-imports");
  });

  it("rejects a deep feature import from a lib module through the alias", async () => {
    await expect(
      ruleIdsFor("features/matches/lib/imports-scoring-deep-alias.ts"),
    ).resolves.toContain("no-restricted-imports");
  });
});

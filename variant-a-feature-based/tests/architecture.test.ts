import path from "node:path";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

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

  it("rejects shared importing a feature", async () => {
    await expect(ruleIdsFor("shared/imports-feature.ts")).resolves.toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects scoring importing matches", async () => {
    await expect(
      ruleIdsFor("features/scoring/imports-matches.ts"),
    ).resolves.toContain("boundaries/dependencies");
  });
});

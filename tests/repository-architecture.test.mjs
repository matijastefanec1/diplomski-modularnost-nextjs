import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ESLint } from "eslint";

const projectRoot = import.meta.dirname;
const fixtureRoot = path.join(
  projectRoot,
  "repository-architecture-fixtures",
  "project",
);

async function ruleIdsFor(relativePath) {
  const eslint = new ESLint({
    cwd: path.resolve(projectRoot, ".."),
    overrideConfigFile: path.resolve(projectRoot, "..", "eslint.config.mjs"),
  });
  const [result] = await eslint.lintFiles([path.join(fixtureRoot, relativePath)]);

  return result.messages.map((message) => message.ruleId);
}

const forbiddenWorkspaceImports = [
  ["variant A importing variant B", "variant-a-feature-based/source/imports-variant-b.ts"],
  ["variant B importing variant A", "variant-b-clean/source/imports-variant-a.ts"],
  ["variant A importing shared E2E", "variant-a-feature-based/source/imports-e2e.ts"],
  ["variant B importing shared E2E", "variant-b-clean/source/imports-e2e.ts"],
  ["shared E2E importing variant A", "e2e/source/imports-variant-a.ts"],
  ["shared E2E importing variant B", "e2e/source/imports-variant-b.ts"],
];

for (const [name, fixture] of forbiddenWorkspaceImports) {
  test(`rejects ${name}`, async () => {
    const ruleIds = await ruleIdsFor(fixture);

    assert.ok(ruleIds.includes("boundaries/dependencies"));
    assert.ok(ruleIds.includes("no-restricted-imports"));
  });
}

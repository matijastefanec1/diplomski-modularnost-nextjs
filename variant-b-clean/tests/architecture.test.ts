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

async function lint(relativePath: string) {
  const eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: path.join(projectRoot, "eslint.config.mjs"),
  });
  const [result] = await eslint.lintFiles([path.join(fixtureRoot, relativePath)]);

  return result.messages;
}

describe("variant B architecture boundaries", () => {
  it("rejects an external import in domain", async () => {
    const messages = await lint("src/domain/imports-react.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects application importing infrastructure", async () => {
    const messages = await lint("src/application/imports-infrastructure.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects presentation importing infrastructure", async () => {
    const messages = await lint("src/presentation/imports-infrastructure.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects app importing infrastructure", async () => {
    const messages = await lint("app/imports-infrastructure.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("allows presentation to import the composition root", async () => {
    const messages = await lint("src/presentation/imports-composition-root.ts");

    expect(
      messages.filter((message) =>
        ["boundaries/dependencies", "no-restricted-imports"].includes(
          message.ruleId ?? "",
        ),
      ),
    ).toHaveLength(0);
  });
});

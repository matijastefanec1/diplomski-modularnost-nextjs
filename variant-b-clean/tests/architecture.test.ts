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

  it("rejects an external import in a domain module folder", async () => {
    const messages = await lint("src/domain/match/imports-zod.ts");

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

  it("rejects domain importing application", async () => {
    const messages = await lint("src/domain/imports-application.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects an external import in application", async () => {
    const messages = await lint("src/application/imports-react.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects presentation importing infrastructure", async () => {
    const messages = await lint("src/presentation/imports-infrastructure.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects presentation importing domain", async () => {
    const messages = await lint("src/presentation/imports-domain.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects infrastructure importing presentation", async () => {
    const messages = await lint("src/infrastructure/imports-presentation.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects presentation importing infrastructure through the alias", async () => {
    const messages = await lint(
      "src/presentation/imports-infrastructure-alias.ts",
    );

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects app importing infrastructure", async () => {
    const messages = await lint("app/imports-infrastructure.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  it("rejects app importing the composition root", async () => {
    const messages = await lint("app/imports-composition-root.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });

  for (const layer of ["domain", "application", "infrastructure"]) {
    it(`rejects ${layer} importing the composition root`, async () => {
      const messages = await lint(`src/${layer}/imports-composition-root.ts`);

      expect(messages.map((message) => message.ruleId)).toContain(
        "boundaries/dependencies",
      );
    });
  }

  it("rejects presentation importing next-auth directly", async () => {
    const messages = await lint("src/presentation/imports-next-auth.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects presentation importing the generated Prisma client", async () => {
    const messages = await lint("src/presentation/imports-prisma.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  for (const source of ["domain", "application", "presentation"]) {
    it(`rejects ${source} relatively importing the generated Prisma client`, async () => {
      const messages = await lint(`src/${source}/imports-prisma-relative.ts`);

      expect(messages.map((message) => message.ruleId)).toContain(
        "no-restricted-imports",
      );
    });
  }

  it("rejects the composition root relatively importing the generated Prisma client", async () => {
    const messages = await lint("src/composition-root-imports-prisma.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects app importing next-auth directly", async () => {
    const messages = await lint("app/imports-next-auth.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects app importing the generated Prisma client", async () => {
    const messages = await lint("app/imports-prisma.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("rejects app relatively importing the generated Prisma client", async () => {
    const messages = await lint("app/imports-prisma-relative.ts");

    expect(messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
  });

  it("allows infrastructure to relatively import the generated Prisma client", async () => {
    const messages = await lint("src/infrastructure/imports-prisma-relative.ts");

    expect(
      messages.filter((message) =>
        ["boundaries/dependencies", "no-restricted-imports"].includes(
          message.ruleId ?? "",
        ),
      ),
    ).toHaveLength(0);
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

  it("allows the composition root to import application and infrastructure", async () => {
    const messages = await lint(
      "../composition-root-allowed/src/composition-root.ts",
    );

    expect(
      messages.filter((message) =>
        ["boundaries/dependencies", "no-restricted-imports"].includes(
          message.ruleId ?? "",
        ),
      ),
    ).toHaveLength(0);
  });

  it("rejects the composition root importing domain directly", async () => {
    const messages = await lint(
      "../composition-root-forbidden/src/composition-root.ts",
    );

    expect(messages.map((message) => message.ruleId)).toContain(
      "boundaries/dependencies",
    );
  });
});

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

const variantRoots = {
  a: "variant-a-feature-based",
  b: "variant-b-clean",
};

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const variantName = readArgument("--variant");
const outputPath = readArgument("--output");
const variantRootName = variantRoots[variantName];

if (!variantRootName || !outputPath) {
  throw new Error(
    "Usage: node scripts/evaluation-prisma-imports.mjs --variant <a|b> --output <json-path>",
  );
}

const workspaceRoot = process.cwd();
const variantRoot = path.join(workspaceRoot, variantRootName);
const scanRoots = ["app", variantName === "a" ? "features" : "src", ...(variantName === "a" ? ["shared"] : [])];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!["generated", ".next", "tests"].includes(entry.name)) {
        files.push(...(await walk(entryPath)));
      }
    } else if (
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function importedModules(sourceFile) {
  const modules = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      modules.push(node.moduleSpecifier.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return modules;
}

function isDirectPrismaImport(importer, specifier) {
  if (specifier === "@prisma/client" || specifier.startsWith("@prisma/client/")) {
    return true;
  }

  if (specifier.startsWith("@/generated/prisma")) {
    return true;
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const resolved = toPosix(path.resolve(path.dirname(importer), specifier));
    return resolved.includes("/generated/prisma");
  }

  return false;
}

const files = (
  await Promise.all(scanRoots.map((scanRoot) => walk(path.join(variantRoot, scanRoot))))
).flat();
const matches = [];

for (const filePath of files) {
  const sourceText = await readFile(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = importedModules(sourceFile).filter((specifier) =>
    isDirectPrismaImport(filePath, specifier),
  );

  if (imports.length > 0) {
    matches.push({
      path: toPosix(path.relative(variantRoot, filePath)),
      imports: [...new Set(imports)].sort(),
    });
  }
}

matches.sort((left, right) => left.path.localeCompare(right.path));
const report = {
  variant: variantName,
  root: variantRootName,
  method:
    "TypeScript AST: direct imports of @prisma/client, @/generated/prisma, or a relative path resolving into generated/prisma; production source only.",
  fileCount: matches.length,
  files: matches,
};
const outputAbsolute = path.resolve(workspaceRoot, outputPath);
await mkdir(path.dirname(outputAbsolute), { recursive: true });
await writeFile(outputAbsolute, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `Variant ${variantName.toUpperCase()}: ${matches.length} production files directly import Prisma Client or generated Prisma types.`,
);
console.log(`Artifact: ${outputPath}`);

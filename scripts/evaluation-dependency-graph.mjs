import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

const variants = {
  a: {
    root: "variant-a-feature-based",
    sourceRoots: ["app", "features", "shared"],
  },
  b: {
    root: "variant-b-clean",
    sourceRoots: ["app", "src"],
  },
};

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const variantName = readArgument("--variant");
const outputPrefix = readArgument("--output");
const variant = variants[variantName];

if (!variant || !outputPrefix) {
  throw new Error(
    "Usage: node scripts/evaluation-dependency-graph.mjs --variant <a|b> --output <path-prefix>",
  );
}

const workspaceRoot = process.cwd();
const variantRoot = path.join(workspaceRoot, variant.root);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function isIncludedSource(filePath) {
  const normalized = toPosix(filePath);
  const baseName = path.basename(filePath);

  return (
    sourceExtensions.has(path.extname(filePath)) &&
    !baseName.endsWith(".d.ts") &&
    !/\.(test|spec)\.[cm]?[jt]sx?$/.test(baseName) &&
    !normalized.includes("/generated/") &&
    !normalized.includes("/tests/") &&
    !normalized.includes("/.next/")
  );
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else if (isIncludedSource(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function ownerOf(relativePath) {
  const segments = relativePath.split("/");

  if (variantName === "a") {
    if (segments[0] === "features" && segments[1]) {
      return `features/${segments[1]}`;
    }

    return ["app", "shared", "prisma"].includes(segments[0])
      ? segments[0]
      : "other";
  }

  if (segments[0] === "src" && segments[1]) {
    return segments[1];
  }

  return ["app", "prisma"].includes(segments[0]) ? segments[0] : "other";
}

function moduleSpecifiers(sourceFile) {
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

const absoluteFiles = (
  await Promise.all(
    variant.sourceRoots.map((sourceRoot) => walk(path.join(variantRoot, sourceRoot))),
  )
).flat();
const relativeFiles = absoluteFiles
  .map((filePath) => toPosix(path.relative(variantRoot, filePath)))
  .sort();
const absoluteByRelative = new Map(
  relativeFiles.map((relativePath) => [
    relativePath,
    path.join(variantRoot, ...relativePath.split("/")),
  ]),
);
const relativeByAbsolute = new Map(
  [...absoluteByRelative].map(([relativePath, absolutePath]) => [
    path.normalize(absolutePath),
    relativePath,
  ]),
);

function resolveInternal(importerAbsolute, specifier) {
  let basePath;

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    basePath = path.resolve(path.dirname(importerAbsolute), specifier);
  } else if (specifier.startsWith("@/")) {
    basePath = path.join(variantRoot, ...specifier.slice(2).split("/"));
  } else {
    return undefined;
  }

  const candidates = [
    basePath,
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs"].map(
      (extension) => `${basePath}${extension}`,
    ),
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs"].map((extension) =>
      path.join(basePath, `index${extension}`),
    ),
  ];

  return candidates
    .map((candidate) => relativeByAbsolute.get(path.normalize(candidate)))
    .find(Boolean);
}

const edges = [];
const externalImports = [];

for (const relativePath of relativeFiles) {
  const absolutePath = absoluteByRelative.get(relativePath);
  const sourceText = await import("node:fs/promises").then(({ readFile }) =>
    readFile(absolutePath, "utf8"),
  );
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  for (const specifier of moduleSpecifiers(sourceFile)) {
    const target = resolveInternal(absolutePath, specifier);

    if (target) {
      edges.push({ from: relativePath, to: target, specifier });
    } else if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
      externalImports.push({ from: relativePath, specifier });
    }
  }
}

const uniqueEdges = [
  ...new Map(edges.map((edge) => [`${edge.from}\0${edge.to}`, edge])).values(),
].sort((left, right) =>
  `${left.from}\0${left.to}`.localeCompare(`${right.from}\0${right.to}`),
);
const ownerEdges = [
  ...new Set(
    uniqueEdges
      .map((edge) => `${ownerOf(edge.from)}\0${ownerOf(edge.to)}`)
      .filter((edge) => {
        const [from, to] = edge.split("\0");
        return from !== to;
      }),
  ),
]
  .map((edge) => {
    const [from, to] = edge.split("\0");
    return { from, to };
  })
  .sort((left, right) =>
    `${left.from}\0${left.to}`.localeCompare(`${right.from}\0${right.to}`),
  );

const report = {
  variant: variantName,
  root: variant.root,
  productionFileCount: relativeFiles.length,
  files: relativeFiles.map((filePath) => ({
    path: filePath,
    owner: ownerOf(filePath),
  })),
  edges: uniqueEdges,
  ownerEdges,
  externalImports: externalImports.sort((left, right) =>
    `${left.from}\0${left.specifier}`.localeCompare(
      `${right.from}\0${right.specifier}`,
    ),
  ),
};
const outputAbsolute = path.resolve(workspaceRoot, outputPrefix);
await mkdir(path.dirname(outputAbsolute), { recursive: true });
await writeFile(`${outputAbsolute}.json`, `${JSON.stringify(report, null, 2)}\n`);

const dotLines = ["digraph SplitScore {", "  rankdir=LR;"];
for (const edge of ownerEdges) {
  dotLines.push(`  "${edge.from}" -> "${edge.to}";`);
}
dotLines.push("}");
await writeFile(`${outputAbsolute}.dot`, `${dotLines.join("\n")}\n`);

console.log(
  `Variant ${variantName.toUpperCase()}: ${relativeFiles.length} production files, ${uniqueEdges.length} internal file edges, ${ownerEdges.length} owner edges.`,
);
console.log(`Artifacts: ${outputPrefix}.json, ${outputPrefix}.dot`);

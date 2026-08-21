import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const prismaDirectories = {
  a: path.join(workspaceRoot, "variant-a-feature-based", "prisma"),
  b: path.join(workspaceRoot, "variant-b-clean", "prisma"),
};

async function collectFiles(directory, relativeDirectory = "") {
  const absoluteDirectory = path.join(directory, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(directory, relativePath)));
      continue;
    }

    files.push(relativePath);
  }

  return files;
}

function digest(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function createSnapshot(directory) {
  const files = await collectFiles(directory);
  const snapshot = new Map();

  for (const relativePath of files) {
    const content = await readFile(path.join(directory, relativePath));
    snapshot.set(relativePath.replaceAll("\\", "/"), digest(content));
  }

  return snapshot;
}

const [snapshotA, snapshotB] = await Promise.all([
  createSnapshot(prismaDirectories.a),
  createSnapshot(prismaDirectories.b),
]);

const allPaths = [...new Set([...snapshotA.keys(), ...snapshotB.keys()])].sort();
const differences = allPaths.filter(
  (relativePath) => snapshotA.get(relativePath) !== snapshotB.get(relativePath),
);

if (differences.length > 0) {
  console.error("Prisma schema and migration trees are not identical:");

  for (const relativePath of differences) {
    console.error(`- ${relativePath}`);
  }

  process.exitCode = 1;
} else {
  console.log(
    `Prisma parity verified (${allPaths.length} files, byte-identical content).`,
  );
}

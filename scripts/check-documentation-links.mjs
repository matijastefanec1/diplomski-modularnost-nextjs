import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.cwd();
const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  ".next",
  "generated",
  "coverage",
  "test-results",
  "playwright-report",
]);

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(entryPath)));
    } else if (entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
}

function localTargets(markdown) {
  const targets = [];
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(linkPattern)) {
    let target = match[1].trim();

    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }

    if (
      target === "" ||
      target.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(target)
    ) {
      continue;
    }

    targets.push(decodeURIComponent(target.split("#", 1)[0]));
  }

  return targets;
}

const files = await markdownFiles(workspaceRoot);
const failures = [];
let checkedLinks = 0;

for (const filePath of files) {
  const markdown = await readFile(filePath, "utf8");

  for (const target of localTargets(markdown)) {
    checkedLinks += 1;
    const resolved = target.startsWith("/")
      ? path.join(workspaceRoot, target.slice(1))
      : path.resolve(path.dirname(filePath), target);

    try {
      await access(resolved);
    } catch {
      failures.push(
        `${path.relative(workspaceRoot, filePath)} -> ${target}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Neispravne lokalne Markdown poveznice:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Dokumentacijske poveznice su valjane: ${checkedLinks} lokalnih poveznica u ${files.length} Markdown datoteka.`,
  );
}

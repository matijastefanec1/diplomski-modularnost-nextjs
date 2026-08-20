import {
  cleanupSyntheticData,
  readCleanupPlan,
} from "./synthetic-data.mjs";

const scopeArgument = process.argv.find((argument) =>
  argument.startsWith("--scope="),
);
const scope = scopeArgument?.slice("--scope=".length) ?? "all";
const apply = process.argv.includes("--apply");
const plan = await readCleanupPlan(undefined, scope);

console.log(`Synthetic cleanup preflight for variant B (scope: ${scope}).`);
console.log(JSON.stringify(plan, null, 2));

if (!apply) {
  console.log("Dry run only. Re-run the explicit apply command to delete.");
} else {
  const result = await cleanupSyntheticData(undefined, scope);
  console.log("Synthetic cleanup applied to variant B.");
  console.log(JSON.stringify(result.deleted, null, 2));
}

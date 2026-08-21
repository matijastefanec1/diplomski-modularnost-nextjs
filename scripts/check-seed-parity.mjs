import assert from "node:assert/strict";

import { readSyntheticSnapshot as readVariantA } from "../variant-a-feature-based/scripts/synthetic-data.mjs";
import { readSyntheticSnapshot as readVariantB } from "../variant-b-clean/scripts/synthetic-data.mjs";

const databaseUrlA =
  process.env.SPLITSCORE_DATABASE_URL_A ??
  "postgresql://splitscore:splitscore@localhost:5432/splitscore_a?schema=public";
const databaseUrlB =
  process.env.SPLITSCORE_DATABASE_URL_B ??
  "postgresql://splitscore:splitscore@localhost:5432/splitscore_b?schema=public";

const [snapshotA, snapshotB] = await Promise.all([
  readVariantA(databaseUrlA),
  readVariantB(databaseUrlB),
]);

assert.deepEqual(snapshotB, snapshotA);
console.log("Synthetic seed parity verified (A and B snapshots are identical).");

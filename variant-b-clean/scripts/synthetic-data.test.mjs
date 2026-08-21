import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import pg from "pg";

import {
  cleanupSyntheticData,
  readCleanupPlan,
  readSyntheticSnapshot,
  seedPlayers,
  seedSyntheticData,
  verifyDemoPassword,
} from "./synthetic-data.mjs";

const { Client } = pg;

const developmentDatabaseUrl =
  "postgresql://splitscore:splitscore@localhost:5432/splitscore_b?schema=public";

function databaseUrlFor(baseUrl, databaseName) {
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

async function applyMigrations(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  const migrations = [
    new URL(
      "../prisma/migrations/20260729000000_initial_foundation/migration.sql",
      import.meta.url,
    ),
    new URL(
      "../prisma/migrations/20260814220000_enforce_match_participant_points_completeness/migration.sql",
      import.meta.url,
    ),
  ];

  await client.connect();

  try {
    for (const migration of migrations) {
      await client.query(await readFile(migration, "utf8"));
    }
  } finally {
    await client.end();
  }
}

test("migrates an empty database and seeds the stable contract idempotently", async () => {
  const baseUrl = process.env.DATABASE_URL ?? developmentDatabaseUrl;
  const databaseName = `splitscore_b_seed_test_${process.pid}_${Date.now()}`;
  const adminUrl = databaseUrlFor(baseUrl, "postgres");
  const disposableUrl = databaseUrlFor(baseUrl, databaseName);
  const admin = new Client({ connectionString: adminUrl });

  await admin.connect();

  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    await applyMigrations(disposableUrl);

    const firstSnapshot = await seedSyntheticData(disposableUrl);
    const secondSnapshot = await seedSyntheticData(disposableUrl);

    assert.deepEqual(secondSnapshot, firstSnapshot);
    assert.deepEqual(firstSnapshot.counts, {
      players: 6,
      matches: 6,
      participants: 24,
      sets: 14,
    });
    assert.deepEqual(firstSnapshot.statuses, {
      PENDING_CONFIRMATION: 1,
      SCORED: 3,
      DISPUTED: 1,
      EXPIRED: 1,
    });
    assert.deepEqual(
      firstSnapshot.players.map((player) => ({
        points: player.points,
        scoredMatchCount: player.scoredMatchCount,
        awardedPoints: player.awardedPoints,
      })),
      [
        { points: 1045, scoredMatchCount: 3, awardedPoints: 45 },
        { points: 1045, scoredMatchCount: 3, awardedPoints: 45 },
        { points: 1020, scoredMatchCount: 2, awardedPoints: 20 },
        { points: 1020, scoredMatchCount: 2, awardedPoints: 20 },
        { points: 1000, scoredMatchCount: 1, awardedPoints: 0 },
        { points: 1000, scoredMatchCount: 1, awardedPoints: 0 },
      ],
    );
    assert.equal(await verifyDemoPassword(disposableUrl), true);

    const disposable = new Client({ connectionString: disposableUrl });
    await disposable.connect();

    try {
      await disposable.query(
        `INSERT INTO players (
           id, name, email, password_hash, points, registered_at, updated_at
         )
         VALUES (
           '90000000-0000-4000-8000-000000000001',
           'Nepovezani igrač',
           'unrelated@example.test',
           'not-a-real-hash',
           1000,
           '2026-08-01T09:00:00.000Z',
           '2026-08-01T09:00:00.000Z'
         )`,
      );
    } finally {
      await disposable.end();
    }

    await seedSyntheticData(disposableUrl);
    assert.deepEqual(await readSyntheticSnapshot(disposableUrl), firstSnapshot);

    const verification = new Client({ connectionString: disposableUrl });
    await verification.connect();

    try {
      const unrelated = await verification.query(
        "SELECT count(*)::integer AS count FROM players WHERE email = 'unrelated@example.test'",
      );
      assert.equal(unrelated.rows[0].count, 1);
      assert.equal(firstSnapshot.players[0].id, seedPlayers[0].id);
    } finally {
      await verification.end();
    }

    assert.deepEqual(await readCleanupPlan(disposableUrl, "seed"), {
      scope: "seed",
      counts: { players: 6, matches: 6, participants: 24, sets: 14 },
      mixedMatchIds: [],
      canApply: true,
    });

    const cleaned = await cleanupSyntheticData(disposableUrl, "seed");
    assert.deepEqual(cleaned.deleted, {
      players: 6,
      matches: 6,
      participants: 24,
      sets: 14,
    });
    assert.deepEqual((await readSyntheticSnapshot(disposableUrl)).counts, {
      players: 0,
      matches: 0,
      participants: 0,
      sets: 0,
    });

    const afterCleanup = new Client({ connectionString: disposableUrl });
    await afterCleanup.connect();

    try {
      const unrelated = await afterCleanup.query(
        "SELECT count(*)::integer AS count FROM players WHERE email = 'unrelated@example.test'",
      );
      assert.equal(unrelated.rows[0].count, 1);
    } finally {
      await afterCleanup.end();
    }

    assert.deepEqual(await seedSyntheticData(disposableUrl), firstSnapshot);

    const mixed = new Client({ connectionString: disposableUrl });
    await mixed.connect();
    const mixedMatchId = "90000000-0000-4000-8000-000000000002";

    try {
      await mixed.query(
        `INSERT INTO matches (
           id, reporter_id, status, recorded_at, updated_at
         ) VALUES (
           $1::uuid, $2::uuid, 'PENDING_CONFIRMATION', now(), now()
         )`,
        [mixedMatchId, seedPlayers[0].id],
      );
      await mixed.query(
        `INSERT INTO match_participants (match_id, player_id, side)
         VALUES
           ($1::uuid, $2::uuid, 'A'),
           ($1::uuid, '90000000-0000-4000-8000-000000000001', 'B')`,
        [mixedMatchId, seedPlayers[0].id],
      );
    } finally {
      await mixed.end();
    }

    const blockedPlan = await readCleanupPlan(disposableUrl, "seed");
    assert.equal(blockedPlan.canApply, false);
    assert.deepEqual(blockedPlan.mixedMatchIds, [mixedMatchId]);
    await assert.rejects(
      cleanupSyntheticData(disposableUrl, "seed"),
      /Cleanup refused mixed matches/,
    );

    const removeMixed = new Client({ connectionString: disposableUrl });
    await removeMixed.connect();

    try {
      await removeMixed.query(
        "DELETE FROM match_participants WHERE match_id = $1::uuid",
        [mixedMatchId],
      );
      await removeMixed.query("DELETE FROM matches WHERE id = $1::uuid", [
        mixedMatchId,
      ]);

      const e2ePlayers = [1, 2, 3, 4].map(
        (index) =>
          `80000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      );
      for (const [index, id] of e2ePlayers.entries()) {
        await removeMixed.query(
          `INSERT INTO players (
             id, name, email, password_hash, points, registered_at, updated_at
           ) VALUES ($1::uuid, $2, $3, 'not-a-real-hash', 1000, now(), now())`,
          [id, `E2E ${index + 1}`, `e2e-clean-${index + 1}@splitscore.test`],
        );
      }

      const e2eMatchId = "80000000-0000-4000-8000-000000000010";
      await removeMixed.query(
        `INSERT INTO matches (
           id, reporter_id, status, recorded_at, updated_at
         ) VALUES ($1::uuid, $2::uuid, 'PENDING_CONFIRMATION', now(), now())`,
        [e2eMatchId, e2ePlayers[0]],
      );
      for (const [index, id] of e2ePlayers.entries()) {
        await removeMixed.query(
          `INSERT INTO match_participants (match_id, player_id, side)
           VALUES ($1::uuid, $2::uuid, $3::match_side)`,
          [e2eMatchId, id, index < 2 ? "A" : "B"],
        );
      }
      await removeMixed.query(
        `INSERT INTO match_sets (
           match_id, set_number, team_a_games, team_b_games
         ) VALUES ($1::uuid, 1, 6, 4), ($1::uuid, 2, 6, 3)`,
        [e2eMatchId],
      );
    } finally {
      await removeMixed.end();
    }

    assert.deepEqual(await readCleanupPlan(disposableUrl, "e2e"), {
      scope: "e2e",
      counts: { players: 4, matches: 1, participants: 4, sets: 2 },
      mixedMatchIds: [],
      canApply: true,
    });
    assert.deepEqual(
      (await cleanupSyntheticData(disposableUrl, "e2e")).deleted,
      { players: 4, matches: 1, participants: 4, sets: 2 },
    );
    assert.deepEqual(await readSyntheticSnapshot(disposableUrl), firstSnapshot);
  } finally {
    await admin.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
      [databaseName],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin.end();
  }
});

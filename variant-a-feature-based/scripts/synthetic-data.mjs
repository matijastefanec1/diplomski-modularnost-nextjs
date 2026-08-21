import "dotenv/config";

import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

export const DEMO_PASSWORD = "SplitScore2026";
export const SEED_EMAIL_SUFFIX = "@seed.splitscore.test";
export const E2E_EMAIL_PATTERN = "e2e-%@splitscore.test";

const playerId = (ending) =>
  `10000000-0000-4000-8000-${String(ending).padStart(12, "0")}`;
const matchId = (ending) =>
  `20000000-0000-4000-8000-${String(ending).padStart(12, "0")}`;

export const seedPlayers = [
  {
    id: playerId(1),
    name: "Ana Demo",
    email: "ana@seed.splitscore.test",
    points: 1045,
    registeredAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: playerId(2),
    name: "Borna Demo",
    email: "borna@seed.splitscore.test",
    points: 1045,
    registeredAt: "2026-08-01T08:01:00.000Z",
  },
  {
    id: playerId(3),
    name: "Cvita Demo",
    email: "cvita@seed.splitscore.test",
    points: 1020,
    registeredAt: "2026-08-01T08:02:00.000Z",
  },
  {
    id: playerId(4),
    name: "Dino Demo",
    email: "dino@seed.splitscore.test",
    points: 1020,
    registeredAt: "2026-08-01T08:03:00.000Z",
  },
  {
    id: playerId(5),
    name: "Ema Demo",
    email: "ema@seed.splitscore.test",
    points: 1000,
    registeredAt: "2026-08-01T08:04:00.000Z",
  },
  {
    id: playerId(6),
    name: "Filip Demonstracijski Igrač S Namjerno Vrlo Dugim Imenom",
    email: "filip@seed.splitscore.test",
    points: 1000,
    registeredAt: "2026-08-01T08:05:00.000Z",
  },
];

export const seedMatches = [
  {
    id: matchId(1),
    reporterId: playerId(1),
    status: "SCORED",
    recordedAt: "2026-08-10T16:00:00.000Z",
    resolvedAt: "2026-08-10T16:05:00.000Z",
    scoredAt: "2026-08-10T16:05:00.000Z",
    participants: [
      [playerId(1), "A", 20, 0, 20],
      [playerId(2), "A", 20, 0, 20],
      [playerId(3), "B", 0, 0, 0],
      [playerId(4), "B", 0, 0, 0],
    ],
    sets: [
      [1, 6, 4],
      [2, 6, 3],
    ],
  },
  {
    id: matchId(2),
    reporterId: playerId(5),
    status: "SCORED",
    recordedAt: "2026-08-11T16:00:00.000Z",
    resolvedAt: "2026-08-11T16:05:00.000Z",
    scoredAt: "2026-08-11T16:05:00.000Z",
    participants: [
      [playerId(5), "A", 0, 0, 0],
      [playerId(6), "A", 0, 0, 0],
      [playerId(1), "B", 20, 0, 20],
      [playerId(2), "B", 20, 0, 20],
    ],
    sets: [
      [1, 4, 6],
      [2, 3, 6],
    ],
  },
  {
    id: matchId(3),
    reporterId: playerId(3),
    status: "SCORED",
    recordedAt: "2026-08-12T16:00:00.000Z",
    resolvedAt: "2026-08-12T16:05:00.000Z",
    scoredAt: "2026-08-12T16:05:00.000Z",
    participants: [
      [playerId(3), "A", 20, 0, 20],
      [playerId(4), "A", 20, 0, 20],
      [playerId(1), "B", 0, 5, 5],
      [playerId(2), "B", 0, 5, 5],
    ],
    sets: [
      [1, 6, 4],
      [2, 6, 4],
    ],
  },
  {
    id: matchId(4),
    reporterId: playerId(2),
    status: "DISPUTED",
    recordedAt: "2026-08-13T16:00:00.000Z",
    resolvedAt: "2026-08-13T16:10:00.000Z",
    scoredAt: null,
    participants: [
      [playerId(2), "A", null, null, null],
      [playerId(3), "A", null, null, null],
      [playerId(4), "B", null, null, null],
      [playerId(5), "B", null, null, null],
    ],
    sets: [
      [1, 6, 4],
      [2, 5, 7],
      [3, 7, 6],
    ],
  },
  {
    id: matchId(5),
    reporterId: playerId(6),
    status: "EXPIRED",
    recordedAt: "2026-08-08T08:00:00.000Z",
    resolvedAt: "2026-08-10T08:00:00.000Z",
    scoredAt: null,
    participants: [
      [playerId(6), "A", null, null, null],
      [playerId(4), "A", null, null, null],
      [playerId(1), "B", null, null, null],
      [playerId(5), "B", null, null, null],
    ],
    sets: [
      [1, 6, 4],
      [2, 6, 2],
    ],
  },
  {
    id: matchId(6),
    reporterId: playerId(1),
    status: "PENDING_CONFIRMATION",
    recordedAt: "2099-01-01T09:00:00.000Z",
    resolvedAt: null,
    scoredAt: null,
    participants: [
      [playerId(1), "A", null, null, null],
      [playerId(5), "A", null, null, null],
      [playerId(3), "B", null, null, null],
      [playerId(6), "B", null, null, null],
    ],
    sets: [
      [1, 6, 4],
      [2, 4, 6],
      [3, 7, 5],
    ],
  },
];

const seedPlayerIds = seedPlayers.map((player) => player.id);
const seedPlayerEmails = seedPlayers.map((player) => player.email);
const seedMatchIds = seedMatches.map((match) => match.id);
const cleanupScopes = new Set(["seed", "e2e", "all"]);

function requireDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for synthetic data tooling.");
  }

  return databaseUrl;
}

function createPool(databaseUrl) {
  return new Pool({ connectionString: requireDatabaseUrl(databaseUrl) });
}

function assertCleanupScope(scope) {
  if (!cleanupScopes.has(scope)) {
    throw new Error(`Unknown cleanup scope: ${scope}.`);
  }
}

async function findCleanupPlayerIds(client, scope) {
  assertCleanupScope(scope);

  if (scope === "seed") {
    const result = await client.query(
      `SELECT id::text
         FROM players
        WHERE id = ANY($1::uuid[])
           OR email LIKE $2
        ORDER BY id`,
      [seedPlayerIds, `%${SEED_EMAIL_SUFFIX}`],
    );
    return result.rows.map((row) => row.id);
  }

  if (scope === "e2e") {
    const result = await client.query(
      "SELECT id::text FROM players WHERE email LIKE $1 ORDER BY id",
      [E2E_EMAIL_PATTERN],
    );
    return result.rows.map((row) => row.id);
  }

  const result = await client.query(
    `SELECT id::text
       FROM players
      WHERE id = ANY($1::uuid[])
         OR email LIKE $2
         OR email LIKE $3
      ORDER BY id`,
    [seedPlayerIds, `%${SEED_EMAIL_SUFFIX}`, E2E_EMAIL_PATTERN],
  );
  return result.rows.map((row) => row.id);
}

async function buildCleanupPlan(client, scope) {
  const playerIds = await findCleanupPlayerIds(client, scope);
  const matches = await client.query(
    `SELECT DISTINCT m.id::text
       FROM matches m
       LEFT JOIN match_participants mp ON mp.match_id = m.id
      WHERE m.reporter_id = ANY($1::uuid[])
         OR mp.player_id = ANY($1::uuid[])
      ORDER BY m.id::text`,
    [playerIds],
  );
  const matchIds = matches.rows.map((row) => row.id);
  const mixedMatches = await client.query(
    `SELECT mp.match_id::text AS id
       FROM match_participants mp
      WHERE mp.match_id = ANY($1::uuid[])
      GROUP BY mp.match_id
     HAVING count(*) FILTER (
              WHERE NOT (mp.player_id = ANY($2::uuid[]))
            ) > 0
      ORDER BY mp.match_id::text`,
    [matchIds, playerIds],
  );
  const counts = await client.query(
    `SELECT
       $1::integer AS players,
       $2::integer AS matches,
       (SELECT count(*)::integer FROM match_participants WHERE match_id = ANY($3::uuid[])) AS participants,
       (SELECT count(*)::integer FROM match_sets WHERE match_id = ANY($3::uuid[])) AS sets`,
    [playerIds.length, matchIds.length, matchIds],
  );

  return {
    scope,
    counts: counts.rows[0],
    mixedMatchIds: mixedMatches.rows.map((row) => row.id),
    canApply: mixedMatches.rowCount === 0,
    playerIds,
    matchIds,
  };
}

function publicCleanupPlan(plan) {
  return {
    scope: plan.scope,
    counts: plan.counts,
    mixedMatchIds: plan.mixedMatchIds,
    canApply: plan.canApply,
  };
}

export async function readCleanupPlan(
  databaseUrl = process.env.DATABASE_URL,
  scope = "all",
) {
  const pool = createPool(databaseUrl);

  try {
    return publicCleanupPlan(await buildCleanupPlan(pool, scope));
  } finally {
    await pool.end();
  }
}

export async function cleanupSyntheticData(
  databaseUrl = process.env.DATABASE_URL,
  scope = "all",
) {
  const pool = createPool(databaseUrl);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const plan = await buildCleanupPlan(client, scope);

    if (!plan.canApply) {
      throw new Error(
        `Cleanup refused mixed matches: ${plan.mixedMatchIds.join(", ")}.`,
      );
    }

    const deletedSets = await client.query(
      "DELETE FROM match_sets WHERE match_id = ANY($1::uuid[])",
      [plan.matchIds],
    );
    const deletedParticipants = await client.query(
      "DELETE FROM match_participants WHERE match_id = ANY($1::uuid[])",
      [plan.matchIds],
    );
    const deletedMatches = await client.query(
      "DELETE FROM matches WHERE id = ANY($1::uuid[])",
      [plan.matchIds],
    );
    const deletedPlayers = await client.query(
      "DELETE FROM players WHERE id = ANY($1::uuid[])",
      [plan.playerIds],
    );

    await client.query("COMMIT");

    return {
      ...publicCleanupPlan(plan),
      deleted: {
        players: deletedPlayers.rowCount,
        matches: deletedMatches.rowCount,
        participants: deletedParticipants.rowCount,
        sets: deletedSets.rowCount,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function assertSeedScopeIsSafe(client) {
  const playerRows = await client.query(
    `SELECT id::text, email
       FROM players
      WHERE id = ANY($1::uuid[])
         OR email = ANY($2::text[])`,
    [seedPlayerIds, seedPlayerEmails],
  );
  const expectedEmailById = new Map(
    seedPlayers.map((player) => [player.id, player.email]),
  );

  for (const row of playerRows.rows) {
    if (expectedEmailById.get(row.id) !== row.email) {
      throw new Error(
        `Seed namespace collision for player ${row.id} (${row.email}).`,
      );
    }
  }

  const unsafeMatches = await client.query(
    `SELECT DISTINCT m.id::text
       FROM matches m
       LEFT JOIN match_participants mp ON mp.match_id = m.id
      WHERE (
              m.reporter_id = ANY($1::uuid[])
              OR mp.player_id = ANY($1::uuid[])
              OR m.id = ANY($2::uuid[])
            )
        AND (
              NOT (m.id = ANY($2::uuid[]))
              OR NOT (m.reporter_id = ANY($1::uuid[]))
              OR EXISTS (
                SELECT 1
                  FROM match_participants outside_participant
                 WHERE outside_participant.match_id = m.id
                   AND NOT (outside_participant.player_id = ANY($1::uuid[]))
              )
            )
      ORDER BY m.id::text`,
    [seedPlayerIds, seedMatchIds],
  );

  if (unsafeMatches.rowCount > 0) {
    throw new Error(
      `Seed players are used outside the stable seed set: ${unsafeMatches.rows
        .map((row) => row.id)
        .join(", ")}.`,
    );
  }
}

async function upsertPlayers(client, passwordHash) {
  for (const player of seedPlayers) {
    await client.query(
      `INSERT INTO players (
         id, name, email, password_hash, points, registered_at, updated_at
       )
       VALUES ($1::uuid, $2, $3, $4, $5, $6::timestamptz, $6::timestamptz)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         points = EXCLUDED.points,
         registered_at = EXCLUDED.registered_at,
         updated_at = EXCLUDED.updated_at`,
      [
        player.id,
        player.name,
        player.email,
        passwordHash,
        player.points,
        player.registeredAt,
      ],
    );
  }
}

async function replaceSeedMatches(client) {
  await client.query(
    "DELETE FROM match_sets WHERE match_id = ANY($1::uuid[])",
    [seedMatchIds],
  );
  await client.query(
    "DELETE FROM match_participants WHERE match_id = ANY($1::uuid[])",
    [seedMatchIds],
  );
  await client.query("DELETE FROM matches WHERE id = ANY($1::uuid[])", [
    seedMatchIds,
  ]);

  for (const match of seedMatches) {
    const updatedAt = match.resolvedAt ?? match.recordedAt;

    await client.query(
      `INSERT INTO matches (
         id, reporter_id, status, recorded_at, resolved_at, scored_at, updated_at
       )
       VALUES (
         $1::uuid, $2::uuid, $3::match_status, $4::timestamptz,
         $5::timestamptz, $6::timestamptz, $7::timestamptz
       )`,
      [
        match.id,
        match.reporterId,
        match.status,
        match.recordedAt,
        match.resolvedAt,
        match.scoredAt,
        updatedAt,
      ],
    );

    for (const [participantId, side, basePoints, activityBonus, totalPoints] of
      match.participants) {
      await client.query(
        `INSERT INTO match_participants (
           match_id, player_id, side, base_points, activity_bonus, total_points
         )
         VALUES (
           $1::uuid, $2::uuid, $3::match_side, $4::integer, $5::integer,
           $6::integer
         )`,
        [
          match.id,
          participantId,
          side,
          basePoints,
          activityBonus,
          totalPoints,
        ],
      );
    }

    for (const [setNumber, teamAGames, teamBGames] of match.sets) {
      await client.query(
        `INSERT INTO match_sets (
           match_id, set_number, team_a_games, team_b_games
         )
         VALUES ($1::uuid, $2, $3, $4)`,
        [match.id, setNumber, teamAGames, teamBGames],
      );
    }
  }
}

export async function readSyntheticSnapshot(databaseUrl) {
  const pool = createPool(databaseUrl);

  try {
    const counts = await pool.query(
      `SELECT
         (SELECT count(*)::integer FROM players WHERE id = ANY($1::uuid[])) AS players,
         (SELECT count(*)::integer FROM matches WHERE id = ANY($2::uuid[])) AS matches,
         (SELECT count(*)::integer FROM match_participants WHERE match_id = ANY($2::uuid[])) AS participants,
         (SELECT count(*)::integer FROM match_sets WHERE match_id = ANY($2::uuid[])) AS sets`,
      [seedPlayerIds, seedMatchIds],
    );
    const players = await pool.query(
      `SELECT
         p.id::text,
         p.name,
         p.email,
         p.points,
         p.registered_at,
         count(mp.match_id) FILTER (WHERE m.status = 'SCORED')::integer AS scored_match_count,
         coalesce(sum(mp.total_points) FILTER (WHERE m.status = 'SCORED'), 0)::integer AS awarded_points
       FROM players p
       LEFT JOIN match_participants mp ON mp.player_id = p.id
       LEFT JOIN matches m ON m.id = mp.match_id
      WHERE p.id = ANY($1::uuid[])
      GROUP BY p.id
      ORDER BY p.id`,
      [seedPlayerIds],
    );
    const statuses = await pool.query(
      `SELECT status::text, count(*)::integer AS count
         FROM matches
        WHERE id = ANY($1::uuid[])
        GROUP BY status
        ORDER BY status`,
      [seedMatchIds],
    );

    return {
      counts: counts.rows[0],
      players: players.rows.map((player) => ({
        id: player.id,
        name: player.name,
        email: player.email,
        points: player.points,
        registeredAt: player.registered_at.toISOString(),
        scoredMatchCount: player.scored_match_count,
        awardedPoints: player.awarded_points,
      })),
      statuses: Object.fromEntries(
        statuses.rows.map((status) => [status.status, status.count]),
      ),
    };
  } finally {
    await pool.end();
  }
}

export async function seedSyntheticData(
  databaseUrl = process.env.DATABASE_URL,
) {
  const pool = createPool(databaseUrl);
  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    await client.query("BEGIN");
    await assertSeedScopeIsSafe(client);
    await upsertPlayers(client, passwordHash);
    await replaceSeedMatches(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  return readSyntheticSnapshot(databaseUrl);
}

export async function verifyDemoPassword(databaseUrl) {
  const pool = createPool(databaseUrl);

  try {
    const result = await pool.query(
      "SELECT password_hash FROM players WHERE id = $1::uuid",
      [seedPlayers[0].id],
    );

    return (
      result.rowCount === 1 &&
      bcrypt.compare(DEMO_PASSWORD, result.rows[0].password_hash)
    );
  } finally {
    await pool.end();
  }
}

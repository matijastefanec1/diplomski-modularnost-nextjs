import { describe, beforeEach, afterAll, it, expect } from "vitest";

import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { decisionDeadlineAt } from "@/features/matches/lib/decision-deadline";
import { expireDueMatches } from "@/features/matches/queries/expire-due-matches";
import { loadMatchDetails } from "@/features/matches/queries/match-details";
import { prisma } from "@/shared/lib/prisma";

const players = [
  { id: "eeeeeeee-0000-4000-8000-000000000001", name: "Expiry Reporter" },
  { id: "eeeeeeee-0000-4000-8000-000000000002", name: "Expiry Partner" },
  { id: "eeeeeeee-0000-4000-8000-000000000003", name: "Expiry Opponent One" },
  { id: "eeeeeeee-0000-4000-8000-000000000004", name: "Expiry Opponent Two" },
];

const dueMatchId = "ffffffff-0000-4000-8000-000000000001";
const freshMatchId = "ffffffff-0000-4000-8000-000000000002";
const untouchedMatchId = "ffffffff-0000-4000-8000-000000000003";

const playerIds = players.map((player) => player.id);
const matchIds = [dueMatchId, freshMatchId, untouchedMatchId];

const now = new Date("2026-08-13T12:00:00.000Z");
const dueRecordedAt = new Date(now.getTime() - 50 * 60 * 60 * 1000);
const freshRecordedAt = new Date(now.getTime() - 47 * 60 * 60 * 1000);

function participants() {
  return players.map((player, index) => ({
    playerId: player.id,
    side: index < 2 ? MatchSide.A : MatchSide.B,
  }));
}

async function removeFixture(): Promise<void> {
  await prisma.matchSet.deleteMany({ where: { matchId: { in: matchIds } } });
  await prisma.matchParticipant.deleteMany({
    where: { matchId: { in: matchIds } },
  });
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
  await prisma.player.deleteMany({ where: { id: { in: playerIds } } });
}

async function createMatch(id: string, recordedAt: Date): Promise<void> {
  await prisma.match.create({
    data: {
      id,
      reporterId: players[0].id,
      status: MatchStatus.PENDING_CONFIRMATION,
      recordedAt,
      participants: { create: participants() },
      sets: {
        create: [
          { setNumber: 1, teamAGames: 6, teamBGames: 4 },
          { setNumber: 2, teamAGames: 7, teamBGames: 5 },
        ],
      },
    },
  });
}

beforeEach(async () => {
  await removeFixture();

  for (const player of players) {
    await prisma.player.create({
      data: {
        ...player,
        email: `${player.id}@expiry.test`,
        passwordHash: "integration-test-not-a-hash",
      },
    });
  }

  await createMatch(dueMatchId, dueRecordedAt);
  await createMatch(freshMatchId, freshRecordedAt);
  await createMatch(untouchedMatchId, dueRecordedAt);
});

afterAll(async () => {
  await removeFixture();

  expect(await prisma.match.count({ where: { id: { in: matchIds } } })).toBe(0);
  expect(await prisma.player.count({ where: { id: { in: playerIds } } })).toBe(
    0,
  );

  await prisma.$disconnect();
});

describe("lazy match expiration", () => {
  it("expires a due match when its details are read", async () => {
    const details = await loadMatchDetails(dueMatchId, now);

    expect(details?.status).toBe(MatchStatus.EXPIRED);
  });

  it("stamps the deadline itself, not the moment of reading", async () => {
    await loadMatchDetails(dueMatchId, now);

    const stored = await prisma.match.findUniqueOrThrow({
      where: { id: dueMatchId },
      select: { resolvedAt: true, scoredAt: true },
    });

    expect(stored.resolvedAt).toEqual(decisionDeadlineAt(dueRecordedAt));
    expect(stored.resolvedAt).not.toEqual(now);
    expect(stored.scoredAt).toBeNull();
  });

  it("leaves a match whose window is still open alone", async () => {
    const details = await loadMatchDetails(freshMatchId, now);

    expect(details?.status).toBe(MatchStatus.PENDING_CONFIRMATION);

    const stored = await prisma.match.findUniqueOrThrow({
      where: { id: freshMatchId },
      select: { resolvedAt: true },
    });

    expect(stored.resolvedAt).toBeNull();
  });

  it("translates only inside the scope of the read that triggered it", async () => {
    await loadMatchDetails(dueMatchId, now);

    const untouched = await prisma.match.findUniqueOrThrow({
      where: { id: untouchedMatchId },
      select: { status: true, resolvedAt: true },
    });

    expect(untouched.status).toBe(MatchStatus.PENDING_CONFIRMATION);
    expect(untouched.resolvedAt).toBeNull();
  });

  it("expires every due match of a player when the scope is the player", async () => {
    const expired = await expireDueMatches({ playerId: players[2].id }, now);

    expect(expired).toBe(2);

    const statuses = await prisma.match.findMany({
      where: { id: { in: matchIds } },
      select: { id: true, status: true },
      orderBy: { id: "asc" },
    });

    expect(statuses).toEqual([
      { id: dueMatchId, status: MatchStatus.EXPIRED },
      { id: freshMatchId, status: MatchStatus.PENDING_CONFIRMATION },
      { id: untouchedMatchId, status: MatchStatus.EXPIRED },
    ]);
  });

  it("reports nothing to do when the same read runs twice", async () => {
    await loadMatchDetails(dueMatchId, now);

    expect(await expireDueMatches({ matchId: dueMatchId }, now)).toBe(0);
  });

  it("answers a malformed identifier without querying", async () => {
    expect(await loadMatchDetails("nije-uuid", now)).toBeNull();
  });

  it("answers null for a match nobody holds", async () => {
    expect(
      await loadMatchDetails("ffffffff-0000-4000-8000-00000000dead", now),
    ).toBeNull();
  });
});

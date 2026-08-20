import { describe, beforeEach, afterAll, it, expect } from "vitest";

import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { decisionDeadlineAt } from "@/features/matches/lib/decision-deadline";
import { loadPlayerMatchHistory } from "@/features/matches/queries/player-match-history";
import { prisma } from "@/shared/lib/prisma";

const owner = { id: "eeee2222-0000-4000-8000-000000000001", name: "History Owner" };
const partner = { id: "eeee2222-0000-4000-8000-000000000002", name: "History Partner" };
const opponentOne = {
  id: "eeee2222-0000-4000-8000-000000000003",
  name: "History Opponent One",
};
const opponentTwo = {
  id: "eeee2222-0000-4000-8000-000000000004",
  name: "History Opponent Two",
};
const stranger = {
  id: "eeee2222-0000-4000-8000-000000000005",
  name: "History Stranger",
};

const players = [owner, partner, opponentOne, opponentTwo, stranger];

const dueMatchId = "ffff2222-0000-4000-8000-000000000001";
const freshMatchId = "ffff2222-0000-4000-8000-000000000002";
const strangersMatchId = "ffff2222-0000-4000-8000-000000000003";

const playerIds = players.map((player) => player.id);
const matchIds = [dueMatchId, freshMatchId, strangersMatchId];

const now = new Date("2026-08-13T12:00:00.000Z");
const dueRecordedAt = new Date(now.getTime() - 50 * 60 * 60 * 1000);
const freshRecordedAt = new Date(now.getTime() - 47 * 60 * 60 * 1000);

async function removeFixture(): Promise<void> {
  await prisma.matchSet.deleteMany({ where: { matchId: { in: matchIds } } });
  await prisma.matchParticipant.deleteMany({
    where: { matchId: { in: matchIds } },
  });
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
  await prisma.player.deleteMany({ where: { id: { in: playerIds } } });
}

async function createMatch(
  id: string,
  recordedAt: Date,
  teamA: { id: string }[],
  teamB: { id: string }[],
): Promise<void> {
  await prisma.match.create({
    data: {
      id,
      reporterId: teamA[0].id,
      status: MatchStatus.PENDING_CONFIRMATION,
      recordedAt,
      participants: {
        create: [
          ...teamA.map((player) => ({
            playerId: player.id,
            side: MatchSide.A,
          })),
          ...teamB.map((player) => ({
            playerId: player.id,
            side: MatchSide.B,
          })),
        ],
      },
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
        email: `${player.id}@history.test`,
        passwordHash: "integration-test-not-a-hash",
      },
    });
  }

  await createMatch(
    dueMatchId,
    dueRecordedAt,
    [owner, partner],
    [opponentOne, opponentTwo],
  );
  await createMatch(
    freshMatchId,
    freshRecordedAt,
    [opponentOne, opponentTwo],
    [owner, partner],
  );
  await createMatch(
    strangersMatchId,
    dueRecordedAt,
    [partner, opponentOne],
    [opponentTwo, stranger],
  );
});

afterAll(async () => {
  await removeFixture();

  expect(await prisma.match.count({ where: { id: { in: matchIds } } })).toBe(0);
  expect(await prisma.player.count({ where: { id: { in: playerIds } } })).toBe(
    0,
  );

  await prisma.$disconnect();
});

describe("player match history", () => {
  it("returns the player's matches, newest first", async () => {
    const history = await loadPlayerMatchHistory(owner.id, now);

    expect(history.map((entry) => entry.id)).toEqual([
      freshMatchId,
      dueMatchId,
    ]);
  });

  it("expires the player's due matches before reading them", async () => {
    const history = await loadPlayerMatchHistory(owner.id, now);

    const due = history.find((entry) => entry.id === dueMatchId);
    const fresh = history.find((entry) => entry.id === freshMatchId);

    expect(due?.status).toBe(MatchStatus.EXPIRED);
    expect(fresh?.status).toBe(MatchStatus.PENDING_CONFIRMATION);
  });

  it("stamps the deadline itself, not the moment of reading", async () => {
    await loadPlayerMatchHistory(owner.id, now);

    const stored = await prisma.match.findUniqueOrThrow({
      where: { id: dueMatchId },
      select: { resolvedAt: true, scoredAt: true },
    });

    expect(stored.resolvedAt).toEqual(decisionDeadlineAt(dueRecordedAt));
    expect(stored.scoredAt).toBeNull();
  });

  it("leaves an equally due match of other players alone", async () => {
    await loadPlayerMatchHistory(owner.id, now);

    const strangers = await prisma.match.findUniqueOrThrow({
      where: { id: strangersMatchId },
      select: { status: true, resolvedAt: true },
    });

    expect(strangers.status).toBe(MatchStatus.PENDING_CONFIRMATION);
    expect(strangers.resolvedAt).toBeNull();
  });

  it("hands over both sides and the sets in the stored direction", async () => {
    const history = await loadPlayerMatchHistory(owner.id, now);
    const fresh = history.find((entry) => entry.id === freshMatchId);

    expect(
      fresh?.participants.find((participant) => participant.id === owner.id)
        ?.side,
    ).toBe(MatchSide.B);
    expect(fresh?.sets).toEqual([
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 7, teamBGames: 5 },
    ]);
  });

  it("answers with an empty history for a player without matches", async () => {
    await prisma.player.create({
      data: {
        id: "eeee2222-0000-4000-8000-00000000000f",
        name: "History Newcomer",
        email: "newcomer@history.test",
        passwordHash: "integration-test-not-a-hash",
      },
    });

    try {
      await expect(
        loadPlayerMatchHistory("eeee2222-0000-4000-8000-00000000000f", now),
      ).resolves.toEqual([]);
    } finally {
      await prisma.player.delete({
        where: { id: "eeee2222-0000-4000-8000-00000000000f" },
      });
    }
  });
});

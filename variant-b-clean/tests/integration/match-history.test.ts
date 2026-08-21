import { describe, beforeEach, afterAll, it, expect } from "vitest";

import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { GetPlayerMatchHistory } from "@/src/application/use-cases/get-player-match-history";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import { prisma } from "@/src/infrastructure/persistence/prisma";
import { PrismaMatchRepository } from "@/src/infrastructure/persistence/prisma-match-repository";

import { FixedClock } from "../support/player-doubles";

const owner = {
  id: "eeee3333-0000-4000-8000-000000000001",
  name: "History Owner",
};
const partner = {
  id: "eeee3333-0000-4000-8000-000000000002",
  name: "History Partner",
};
const opponentOne = {
  id: "eeee3333-0000-4000-8000-000000000003",
  name: "History Opponent One",
};
const opponentTwo = {
  id: "eeee3333-0000-4000-8000-000000000004",
  name: "History Opponent Two",
};
const stranger = {
  id: "eeee3333-0000-4000-8000-000000000005",
  name: "History Stranger",
};

const players = [owner, partner, opponentOne, opponentTwo, stranger];

const dueMatchId = "ffff3333-0000-4000-8000-000000000001";
const freshMatchId = "ffff3333-0000-4000-8000-000000000002";
const strangersMatchId = "ffff3333-0000-4000-8000-000000000003";

const playerIds = players.map((player) => player.id);
const matchIds = [dueMatchId, freshMatchId, strangersMatchId];

const now = new Date("2026-08-13T12:00:00.000Z");
const dueRecordedAt = new Date(now.getTime() - 50 * 60 * 60 * 1000);
const freshRecordedAt = new Date(now.getTime() - 47 * 60 * 60 * 1000);

const matches = new PrismaMatchRepository();
const getPlayerMatchHistory = new GetPlayerMatchHistory(
  matches,
  new FixedClock(now),
);

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
    const history = await getPlayerMatchHistory.execute(owner.id);

    expect(history.map((entry) => entry.id)).toEqual([
      freshMatchId,
      dueMatchId,
    ]);
  });

  it("expires the player's due matches before reading them", async () => {
    const history = await getPlayerMatchHistory.execute(owner.id);

    expect(history.find((entry) => entry.id === dueMatchId)?.status).toBe(
      "EXPIRED",
    );
    expect(history.find((entry) => entry.id === freshMatchId)?.status).toBe(
      "PENDING_CONFIRMATION",
    );
  });

  it("stamps the deadline itself, not the moment of reading", async () => {
    await getPlayerMatchHistory.execute(owner.id);

    const stored = await prisma.match.findUniqueOrThrow({
      where: { id: dueMatchId },
      select: { resolvedAt: true, scoredAt: true },
    });

    expect(stored.resolvedAt).toEqual(decisionDeadlineAt(dueRecordedAt));
    expect(stored.scoredAt).toBeNull();
  });

  it("leaves an equally due match of other players alone", async () => {
    await getPlayerMatchHistory.execute(owner.id);

    const strangers = await prisma.match.findUniqueOrThrow({
      where: { id: strangersMatchId },
      select: { status: true, resolvedAt: true },
    });

    expect(strangers.status).toBe(MatchStatus.PENDING_CONFIRMATION);
    expect(strangers.resolvedAt).toBeNull();
  });

  it("hands over both sides and the sets in the stored direction", async () => {
    const history = await getPlayerMatchHistory.execute(owner.id);
    const fresh = history.find((entry) => entry.id === freshMatchId);

    expect(
      fresh?.participants.find((participant) => participant.id === owner.id)
        ?.side,
    ).toBe("B");
    expect(fresh?.sets).toEqual([
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 7, teamBGames: 5 },
    ]);
  });

  it("answers with an empty history for a player without matches", async () => {
    await prisma.player.create({
      data: {
        id: "eeee3333-0000-4000-8000-00000000000f",
        name: "History Newcomer",
        email: "newcomer-b@history.test",
        passwordHash: "integration-test-not-a-hash",
      },
    });

    try {
      await expect(
        getPlayerMatchHistory.execute("eeee3333-0000-4000-8000-00000000000f"),
      ).resolves.toEqual([]);
    } finally {
      await prisma.player.delete({
        where: { id: "eeee3333-0000-4000-8000-00000000000f" },
      });
    }
  });
});

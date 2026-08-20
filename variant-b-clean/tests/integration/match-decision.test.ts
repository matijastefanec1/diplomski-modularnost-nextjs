import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { ConfirmMatch } from "@/src/application/use-cases/confirm-match";
import { DecideMatch } from "@/src/application/use-cases/decide-match";
import { DisputeMatch } from "@/src/application/use-cases/dispute-match";
import { GetMatchDetails } from "@/src/application/use-cases/get-match-details";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import { prisma } from "@/src/infrastructure/persistence/prisma";
import { PrismaMatchRepository } from "@/src/infrastructure/persistence/prisma-match-repository";
import { PrismaUnitOfWork } from "@/src/infrastructure/persistence/prisma-unit-of-work";

import { FixedClock } from "../support/player-doubles";

const STARTING_POINTS = 1000;
const WIN_VS_SIMILAR = 20;
const ACTIVITY_BONUS = 5;

const reporter = { id: "eeee5555-0000-4000-8000-000000000001", name: "Decision Reporter" };
const partner = { id: "eeee5555-0000-4000-8000-000000000002", name: "Decision Partner" };
const opponentOne = { id: "eeee5555-0000-4000-8000-000000000003", name: "Decision Opponent One" };
const opponentTwo = { id: "eeee5555-0000-4000-8000-000000000004", name: "Decision Opponent Two" };
const stranger = { id: "eeee5555-0000-4000-8000-000000000005", name: "Decision Stranger" };

const players = [reporter, partner, opponentOne, opponentTwo, stranger];
const playerIds = players.map((player) => player.id);

const openMatchId = "ffff5555-0000-4000-8000-000000000001";
const dueMatchId = "ffff5555-0000-4000-8000-000000000002";
const historyMatchIds = [
  "ffff5555-0000-4000-8000-000000000003",
  "ffff5555-0000-4000-8000-000000000004",
];

const matchIds = [openMatchId, dueMatchId, ...historyMatchIds];

const now = new Date("2026-08-13T12:00:00.000Z");
const openRecordedAt = new Date(now.getTime() - 60 * 60 * 1000);
const dueRecordedAt = new Date(now.getTime() - 50 * 60 * 60 * 1000);

const matches = new PrismaMatchRepository();
const clock = new FixedClock(now);
const decision = new DecideMatch(matches, new PrismaUnitOfWork(), clock);
const confirmMatch = new ConfirmMatch(decision);
const disputeMatch = new DisputeMatch(decision);
const getMatchDetails = new GetMatchDetails(matches, clock);

async function removeFixture(): Promise<void> {
  await prisma.matchSet.deleteMany({ where: { matchId: { in: matchIds } } });
  await prisma.matchParticipant.deleteMany({
    where: { matchId: { in: matchIds } },
  });
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
  await prisma.player.deleteMany({ where: { id: { in: playerIds } } });
}

function participants() {
  return [reporter, partner, opponentOne, opponentTwo].map(
    (player, index) => ({
      playerId: player.id,
      side: index < 2 ? MatchSide.A : MatchSide.B,
    }),
  );
}

async function createPendingMatch(id: string, recordedAt: Date): Promise<void> {
  await prisma.match.create({
    data: {
      id,
      reporterId: reporter.id,
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

async function createScoredMatch(id: string, scoredAt: Date): Promise<void> {
  await prisma.match.create({
    data: {
      id,
      reporterId: reporter.id,
      status: MatchStatus.SCORED,
      recordedAt: new Date(scoredAt.getTime() - 60 * 60 * 1000),
      resolvedAt: scoredAt,
      scoredAt,
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

function pointsOf(playerId: string): Promise<number> {
  return prisma.player
    .findUniqueOrThrow({ where: { id: playerId }, select: { points: true } })
    .then((player) => player.points);
}

async function allPoints(): Promise<number[]> {
  return Promise.all(
    [reporter, partner, opponentOne, opponentTwo].map((player) =>
      pointsOf(player.id),
    ),
  );
}

beforeEach(async () => {
  await removeFixture();

  for (const player of players) {
    await prisma.player.create({
      data: {
        ...player,
        email: `${player.id}@decision.test`,
        passwordHash: "integration-test-not-a-hash",
        points: STARTING_POINTS,
      },
    });
  }

  await createPendingMatch(openMatchId, openRecordedAt);
  await createPendingMatch(dueMatchId, dueRecordedAt);
});

afterAll(async () => {
  await removeFixture();

  expect(await prisma.match.count({ where: { id: { in: matchIds } } })).toBe(0);
  expect(await prisma.player.count({ where: { id: { in: playerIds } } })).toBe(
    0,
  );

  await prisma.$disconnect();
});

describe("match decision", () => {
  it("confirms, scores and increases the points of all four players", async () => {
    const outcome = await confirmMatch.execute(openMatchId, opponentOne.id);

    expect(outcome).toEqual({ outcome: "confirmed" });

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: openMatchId },
      select: { status: true, resolvedAt: true, scoredAt: true },
    });

    expect(match.status).toBe(MatchStatus.SCORED);
    expect(match.resolvedAt).toEqual(now);
    expect(match.scoredAt).toEqual(now);

    expect(await allPoints()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });

  it("writes all three point columns, zeros included", async () => {
    await confirmMatch.execute(openMatchId, opponentOne.id);

    const awarded = await prisma.matchParticipant.findMany({
      where: { matchId: openMatchId },
      select: {
        playerId: true,
        basePoints: true,
        activityBonus: true,
        totalPoints: true,
      },
      orderBy: { playerId: "asc" },
    });

    expect(awarded).toEqual([
      {
        playerId: reporter.id,
        basePoints: WIN_VS_SIMILAR,
        activityBonus: 0,
        totalPoints: WIN_VS_SIMILAR,
      },
      {
        playerId: partner.id,
        basePoints: WIN_VS_SIMILAR,
        activityBonus: 0,
        totalPoints: WIN_VS_SIMILAR,
      },
      {
        playerId: opponentOne.id,
        basePoints: 0,
        activityBonus: 0,
        totalPoints: 0,
      },
      {
        playerId: opponentTwo.id,
        basePoints: 0,
        activityBonus: 0,
        totalPoints: 0,
      },
    ]);
  });

  it.each([
    ["only base points", { basePoints: 1, activityBonus: null, totalPoints: null }],
    ["only activity bonus", { basePoints: null, activityBonus: 1, totalPoints: null }],
    ["only total points", { basePoints: null, activityBonus: null, totalPoints: 1 }],
    ["base points and activity bonus", { basePoints: 1, activityBonus: 0, totalPoints: null }],
    ["base points and total points", { basePoints: 1, activityBonus: null, totalPoints: 1 }],
    ["activity bonus and total points", { basePoints: null, activityBonus: 0, totalPoints: 0 }],
  ])("rejects a partial point audit with %s", async (_case, points) => {
    await expect(
      prisma.matchParticipant.update({
        where: {
          matchId_playerId: { matchId: openMatchId, playerId: reporter.id },
        },
        data: points,
      }),
    ).rejects.toThrow(/match_participants_points_check/);

    await expect(
      prisma.matchParticipant.findUniqueOrThrow({
        where: {
          matchId_playerId: { matchId: openMatchId, playerId: reporter.id },
        },
        select: {
          basePoints: true,
          activityBonus: true,
          totalPoints: true,
        },
      }),
    ).resolves.toEqual({
      basePoints: null,
      activityBonus: null,
      totalPoints: null,
    });
  });

  it("adds the activity bonus from the third scored match in the window", async () => {
    await createScoredMatch(
      historyMatchIds[0],
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
    );
    await createScoredMatch(
      historyMatchIds[1],
      new Date(now.getTime() - 48 * 60 * 60 * 1000),
    );

    await confirmMatch.execute(openMatchId, opponentOne.id);

    expect(await allPoints()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR + ACTIVITY_BONUS,
      STARTING_POINTS + WIN_VS_SIMILAR + ACTIVITY_BONUS,
      STARTING_POINTS + ACTIVITY_BONUS,
      STARTING_POINTS + ACTIVITY_BONUS,
    ]);
  });

  it("withholds the bonus when the match being scored is only the second", async () => {
    await createScoredMatch(
      historyMatchIds[0],
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
    );

    await confirmMatch.execute(openMatchId, opponentOne.id);

    expect(await allPoints()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });

  it("disputes the match without touching a single point", async () => {
    const outcome = await disputeMatch.execute(openMatchId, opponentTwo.id);

    expect(outcome).toEqual({ outcome: "disputed" });

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: openMatchId },
      select: { status: true, resolvedAt: true, scoredAt: true },
    });

    expect(match.status).toBe(MatchStatus.DISPUTED);
    expect(match.resolvedAt).toEqual(now);
    expect(match.scoredAt).toBeNull();

    expect(await allPoints()).toEqual([
      STARTING_POINTS,
      STARTING_POINTS,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);

    const awarded = await prisma.matchParticipant.findMany({
      where: { matchId: openMatchId },
      select: { totalPoints: true },
    });

    expect(awarded.every((entry) => entry.totalPoints === null)).toBe(true);
  });

  it.each([
    ["the reporter", () => reporter.id],
    ["the reporter's partner", () => partner.id],
    ["a player who is not in the match", () => stranger.id],
  ])("refuses a decision by %s", async (_who, playerId) => {
    const outcome = await confirmMatch.execute(openMatchId, playerId());

    expect(outcome).toEqual({ outcome: "not-opponent" });

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: openMatchId },
      select: { status: true },
    });

    expect(match.status).toBe(MatchStatus.PENDING_CONFIRMATION);
  });

  it("refuses a malformed identifier without querying", async () => {
    await expect(
      confirmMatch.execute("nije-uuid", opponentOne.id),
    ).resolves.toEqual({ outcome: "not-opponent" });
  });

  it("refuses a decision once the deadline has passed, and expires the match", async () => {
    const outcome = await confirmMatch.execute(dueMatchId, opponentOne.id);

    expect(outcome).toEqual({ outcome: "deadline-passed" });

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: dueMatchId },
      select: { status: true, resolvedAt: true, scoredAt: true },
    });

    expect(match.status).toBe(MatchStatus.EXPIRED);
    expect(match.resolvedAt).toEqual(decisionDeadlineAt(dueRecordedAt));
    expect(match.scoredAt).toBeNull();

    expect(await allPoints()).toEqual([
      STARTING_POINTS,
      STARTING_POINTS,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });

  it("agrees with the read about the same due match", async () => {
    const details = await getMatchDetails.execute(dueMatchId);

    expect(details?.match.status).toBe("EXPIRED");

    const outcome = await disputeMatch.execute(dueMatchId, opponentOne.id);

    expect(outcome).toEqual({ outcome: "deadline-passed" });

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: dueMatchId },
      select: { resolvedAt: true },
    });

    expect(match.resolvedAt).toEqual(decisionDeadlineAt(dueRecordedAt));
  });

  it("lets exactly one of two simultaneous confirmations through", async () => {
    const outcomes = await Promise.all([
      confirmMatch.execute(openMatchId, opponentOne.id),
      confirmMatch.execute(openMatchId, opponentTwo.id),
    ]);

    expect(
      outcomes.filter((outcome) => outcome.outcome === "confirmed"),
    ).toHaveLength(1);
    expect(outcomes).toContainEqual({
      outcome: "already-decided",
      status: "SCORED",
    });

    expect(await allPoints()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });

  it("lets exactly one of a simultaneous confirmation and dispute through", async () => {
    const [confirmed, disputed] = await Promise.all([
      confirmMatch.execute(openMatchId, opponentOne.id),
      disputeMatch.execute(openMatchId, opponentTwo.id),
    ]);

    const winners = [confirmed, disputed].filter(
      (outcome) =>
        outcome.outcome === "confirmed" || outcome.outcome === "disputed",
    );

    expect(winners).toHaveLength(1);

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: openMatchId },
      select: { status: true },
    });

    const confirmationWon = winners[0].outcome === "confirmed";

    expect(match.status).toBe(
      confirmationWon ? MatchStatus.SCORED : MatchStatus.DISPUTED,
    );
    expect(await pointsOf(reporter.id)).toBe(
      confirmationWon ? STARTING_POINTS + WIN_VS_SIMILAR : STARTING_POINTS,
    );
  });

  it("refuses a second decision after the first one settled the match", async () => {
    await disputeMatch.execute(openMatchId, opponentOne.id);

    const outcome = await confirmMatch.execute(openMatchId, opponentTwo.id);

    expect(outcome).toEqual({
      outcome: "already-decided",
      status: "DISPUTED",
    });
  });
});

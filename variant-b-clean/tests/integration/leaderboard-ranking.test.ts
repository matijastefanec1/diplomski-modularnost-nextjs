import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/src/infrastructure/persistence/prisma";
import { createCompositionRoot } from "@/src/composition-root";
import type { PlayerStanding } from "@/src/domain/player/player";

const registeredEarly = new Date("2026-01-01T10:00:00.000Z");
const registeredMid = new Date("2026-01-01T10:30:00.000Z");
const registeredLate = new Date("2026-01-01T11:00:00.000Z");

const players = [
  {
    id: "aaaaaaaa-0000-4000-8000-000000000002",
    name: "Tie Higher Id",
    email: "tie-higher-id@leaderboard.test",
    points: 1000,
    registeredAt: registeredMid,
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    name: "Tie Lower Id",
    email: "tie-lower-id@leaderboard.test",
    points: 1000,
    registeredAt: registeredMid,
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000001",
    name: "Early Bird",
    email: "early-bird@leaderboard.test",
    points: 1000,
    registeredAt: registeredEarly,
  },
  {
    id: "cccccccc-0000-4000-8000-000000000001",
    name: "Top Scorer",
    email: "top-scorer@leaderboard.test",
    points: 1040,
    registeredAt: registeredLate,
  },
];

const expectedOrder = [
  "Top Scorer",
  "Early Bird",
  "Tie Lower Id",
  "Tie Higher Id",
];

const scoredMatchId = "dddddddd-0000-4000-8000-000000000001";
const pendingMatchId = "dddddddd-0000-4000-8000-000000000002";

const playerIds = players.map((player) => player.id);
const matchIds = [scoredMatchId, pendingMatchId];

const { getLeaderboard, getPlayerProfile } = createCompositionRoot();

async function removeFixture(): Promise<void> {
  await prisma.matchParticipant.deleteMany({
    where: { matchId: { in: matchIds } },
  });
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
  await prisma.player.deleteMany({ where: { id: { in: playerIds } } });
}

function fixtureEntries(entries: PlayerStanding[]): PlayerStanding[] {
  return entries.filter((entry) => playerIds.includes(entry.id));
}

function participants() {
  return players.map((player, index) => ({
    playerId: player.id,
    side: index < 2 ? MatchSide.A : MatchSide.B,
  }));
}

describe("leaderboard ranking", () => {
  beforeAll(async () => {
    await removeFixture();

    for (const player of players) {
      await prisma.player.create({
        data: { ...player, passwordHash: "integration-test-not-a-hash" },
      });
    }

    await prisma.match.create({
      data: {
        id: scoredMatchId,
        reporterId: players[0].id,
        status: MatchStatus.SCORED,
        resolvedAt: registeredLate,
        scoredAt: registeredLate,
        participants: { create: participants() },
      },
    });
    await prisma.match.create({
      data: {
        id: pendingMatchId,
        reporterId: players[0].id,
        status: MatchStatus.PENDING_CONFIRMATION,
        participants: { create: participants() },
      },
    });
  });

  afterAll(async () => {
    await removeFixture();

    expect(
      await prisma.player.count({ where: { id: { in: playerIds } } }),
    ).toBe(0);
    expect(await prisma.match.count({ where: { id: { in: matchIds } } })).toBe(
      0,
    );

    await prisma.$disconnect();
  });

  it("orders players by points, then registration time, then id", async () => {
    const entries = await getLeaderboard.execute();

    expect(fixtureEntries(entries).map((entry) => entry.name)).toEqual(
      expectedOrder,
    );
  });

  it("numbers the positions consecutively, without shared places", async () => {
    const entries = await getLeaderboard.execute();

    expect(entries.map((entry) => entry.rank)).toEqual(
      entries.map((_, index) => index + 1),
    );
  });

  it("counts only scored matches, without a query per player", async () => {
    const entries = await getLeaderboard.execute();

    expect(
      fixtureEntries(entries).map((entry) => entry.scoredMatchCount),
    ).toEqual([1, 1, 1, 1]);
  });

  it("gives every player the same position as the public profile", async () => {
    const entries = await getLeaderboard.execute();

    const profileRanks = await Promise.all(
      entries.map(async (entry) => {
        const profile = await getPlayerProfile.execute(entry.id);

        return profile?.rank;
      }),
    );

    expect(profileRanks).toEqual(entries.map((entry) => entry.rank));
  });

  it("agrees with the profile on points and scored matches", async () => {
    const entries = await getLeaderboard.execute();

    for (const entry of entries) {
      const profile = await getPlayerProfile.execute(entry.id);

      expect(profile).toMatchObject({
        name: entry.name,
        points: entry.points,
        scoredMatchCount: entry.scoredMatchCount,
      });
    }
  });

  it("answers with null for a player id nobody holds", async () => {
    await expect(
      getPlayerProfile.execute("eeeeeeee-0000-4000-8000-000000000001"),
    ).resolves.toBeNull();
  });

  it("answers with null for a malformed id instead of failing the query", async () => {
    await expect(getPlayerProfile.execute("nije-uuid")).resolves.toBeNull();
  });
});

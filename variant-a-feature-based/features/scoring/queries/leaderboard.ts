import { MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

export type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
  scoredMatchCount: number;
  rank: number;
};

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      points: true,
      _count: {
        select: {
          participations: { where: { match: { status: MatchStatus.SCORED } } },
        },
      },
    },
    // isto pravilo poretka stoji i u players/lib/player-profile.ts
    orderBy: [{ points: "desc" }, { registeredAt: "asc" }, { id: "asc" }],
  });

  return players.map((player, index) => ({
    id: player.id,
    name: player.name,
    points: player.points,
    scoredMatchCount: player._count.participations,
    rank: index + 1,
  }));
}

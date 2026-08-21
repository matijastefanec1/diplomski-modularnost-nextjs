import { MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import { isPlayerId } from "./player-id";

export type PlayerProfile = {
  id: string;
  name: string;
  points: number;
  scoredMatchCount: number;
  rank: number;
};

type RankedPlayer = {
  id: string;
  points: number;
  registeredAt: Date;
};

// isto pravilo poretka stoji i u scoring/queries/leaderboard.ts, mora se držati u koraku
// pozicija se broji jednim COUNT-om, lista igrača se ne učitava
function countPlayersAhead(player: RankedPlayer): Promise<number> {
  return prisma.player.count({
    where: {
      OR: [
        { points: { gt: player.points } },
        { points: player.points, registeredAt: { lt: player.registeredAt } },
        {
          points: player.points,
          registeredAt: player.registeredAt,
          id: { lt: player.id },
        },
      ],
    },
  });
}

export async function loadPlayerProfile(
  playerId: string,
): Promise<PlayerProfile | null> {
  if (!isPlayerId(playerId)) {
    return null;
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, name: true, points: true, registeredAt: true },
  });

  if (!player) {
    return null;
  }

  const [playersAhead, scoredMatchCount] = await Promise.all([
    countPlayersAhead(player),
    prisma.matchParticipant.count({
      where: { playerId: player.id, match: { status: MatchStatus.SCORED } },
    }),
  ]);

  return {
    id: player.id,
    name: player.name,
    points: player.points,
    scoredMatchCount,
    rank: playersAhead + 1,
  };
}

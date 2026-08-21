import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import type { SetScore } from "../lib/match-result";
import { expireDueMatches } from "./expire-due-matches";

export type MatchHistoryParticipant = {
  id: string;
  side: MatchSide;
  name: string;
};

export type MatchHistoryEntry = {
  id: string;
  status: MatchStatus;
  recordedAt: Date;
  participants: MatchHistoryParticipant[];
  sets: SetScore[];
};

export async function loadPlayerMatchHistory(
  playerId: string,
  now: Date = new Date(),
): Promise<MatchHistoryEntry[]> {
  await expireDueMatches({ playerId }, now);

  const matches = await prisma.match.findMany({
    where: { participants: { some: { playerId } } },
    orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      status: true,
      recordedAt: true,
      participants: {
        select: { side: true, player: { select: { id: true, name: true } } },
      },
      sets: {
        select: { teamAGames: true, teamBGames: true },
        orderBy: { setNumber: "asc" },
      },
    },
  });

  return matches.map((match) => ({
    id: match.id,
    status: match.status,
    recordedAt: match.recordedAt,
    participants: match.participants.map((participant) => ({
      id: participant.player.id,
      name: participant.player.name,
      side: participant.side,
    })),
    sets: match.sets,
  }));
}

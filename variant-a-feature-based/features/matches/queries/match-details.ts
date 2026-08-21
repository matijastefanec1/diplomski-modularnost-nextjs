import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import { isMatchId } from "../lib/match-id";
import type { SetScore } from "../lib/match-result";
import { expireDueMatches } from "./expire-due-matches";

export type MatchParticipantView = {
  id: string;
  name: string;
};

export type MatchDetails = {
  id: string;
  status: MatchStatus;
  recordedAt: Date;
  teamA: MatchParticipantView[];
  teamB: MatchParticipantView[];
  sets: SetScore[];
};

export async function loadMatchDetails(
  matchId: string,
  now: Date = new Date(),
): Promise<MatchDetails | null> {
  if (!isMatchId(matchId)) {
    return null;
  }

  await expireDueMatches({ matchId }, now);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
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

  if (!match) {
    return null;
  }

  const sideOf = (side: MatchSide): MatchParticipantView[] =>
    match.participants
      .filter((participant) => participant.side === side)
      .map((participant) => participant.player);

  return {
    id: match.id,
    status: match.status,
    recordedAt: match.recordedAt,
    teamA: sideOf(MatchSide.A),
    teamB: sideOf(MatchSide.B),
    sets: match.sets,
  };
}

import {
  assignMatchPoints,
  activityWindowStart,
  type PlayerScoringInput,
  type MatchSidePlayers,
} from "@/features/scoring";
import {
  MatchStatus,
  MatchSide,
  type Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import { latestExpiredRecordedAt } from "../lib/decision-deadline";
import { isMatchId } from "../lib/match-id";
import {
  deriveMatchWinner,
  type SetScore,
  type MatchSets,
} from "../lib/match-result";
import { expireDueMatches } from "../queries/expire-due-matches";

export type MatchDecision = "confirm" | "dispute";

export type MatchDecisionOutcome =
  | { outcome: "confirmed" }
  | { outcome: "disputed" }
  | { outcome: "already-decided"; status: MatchStatus }
  | { outcome: "deadline-passed" }
  | { outcome: "not-opponent" };

export type MatchDecisionOutcomeName = MatchDecisionOutcome["outcome"];

export type MatchDecisionState = MatchDecisionOutcome | null;

type ParticipantSide = { playerId: string; side: MatchSide };

// odlučiti smije samo igrač suprotne strane od prijavitelja
function isOpponentOfReporter(
  match: { reporterId: string; participants: ParticipantSide[] },
  deciderId: string,
): boolean {
  const reporter = match.participants.find(
    (participant) => participant.playerId === match.reporterId,
  );
  const decider = match.participants.find(
    (participant) => participant.playerId === deciderId,
  );

  return (
    reporter !== undefined &&
    decider !== undefined &&
    decider.side !== reporter.side
  );
}

function toMatchSets(scores: SetScore[], matchId: string): MatchSets {
  if (scores.length === 2) {
    return [scores[0], scores[1]];
  }

  if (scores.length === 3) {
    return [scores[0], scores[1], scores[2]];
  }

  throw new Error(
    `Match ${matchId} has ${scores.length} sets, expected 2 or 3`,
  );
}

function toSidePlayers(
  players: PlayerScoringInput[],
  side: MatchSide,
  matchId: string,
): MatchSidePlayers {
  if (players.length !== 2) {
    throw new Error(
      `Side ${side} of match ${matchId} has ${players.length} players, expected 2`,
    );
  }
  return [players[0], players[1]];
}

async function awardPoints(
  tx: Prisma.TransactionClient,
  matchId: string,
  now: Date,
): Promise<void> {
  const participants = await tx.matchParticipant.findMany({
    where: { matchId },
    select: {
      playerId: true,
      side: true,
      player: { select: { points: true } },
    },
  });

  const scoredInWindow = await tx.matchParticipant.groupBy({
    by: ["playerId"],
    where: {
      playerId: { in: participants.map((participant) => participant.playerId) },
      // transakcija je ovaj meč već prebacila u SCORED, a modul ga dodaje kroz +1
      matchId: { not: matchId },
      match: {
        status: MatchStatus.SCORED,
        scoredAt: { gte: activityWindowStart(now) },
      },
    },
    _count: { _all: true },
  });

  const scoredCount = (playerId: string): number =>
    scoredInWindow.find((entry) => entry.playerId === playerId)?._count._all ??
    0;

  const sideInputs = (side: MatchSide): MatchSidePlayers =>
    toSidePlayers(
      participants
        .filter((participant) => participant.side === side)
        .map((participant) => ({
          playerId: participant.playerId,
          pointsBefore: participant.player.points,
          scoredMatchesInWindow: scoredCount(participant.playerId),
        })),
      side,
      matchId,
    );

  const sets = await tx.matchSet.findMany({
    where: { matchId },
    select: { teamAGames: true, teamBGames: true },
    orderBy: { setNumber: "asc" },
  });

  const winningSide = deriveMatchWinner(toMatchSets(sets, matchId));

  // meč bez pobjednika je nemoguće stanje, pa baca i poništava transakciju
  if (winningSide === null) {
    throw new Error(`No winning side on match ${matchId}`);
  }

  const awards = assignMatchPoints({
    teamA: sideInputs(MatchSide.A),
    teamB: sideInputs(MatchSide.B),
    winningSide,
  });

  for (const award of awards) {
    await tx.matchParticipant.update({
      where: { matchId_playerId: { matchId, playerId: award.playerId } },
      data: {
        basePoints: award.basePoints,
        activityBonus: award.activityBonus,
        totalPoints: award.totalPoints,
      },
    });
    // bodovi se zbrajaju, drugi upis ne pregazuje prvi!
    await tx.player.update({
      where: { id: award.playerId },
      data: { points: { increment: award.totalPoints } },
    });
  }
}

export async function decideMatch(
  matchId: string,
  decision: MatchDecision,
  deciderId: string,
  now: Date = new Date(),
): Promise<MatchDecisionOutcome> {
  // neispravan id ne pripada nijednom meču, isti odgovor kao za tuđi meč
  if (!isMatchId(matchId)) {
    return { outcome: "not-opponent" };
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      reporterId: true,
      participants: { select: { playerId: true, side: true } },
    },
  });

  if (!match || !isOpponentOfReporter(match, deciderId)) {
    return { outcome: "not-opponent" };
  }

  const changed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.match.updateMany({
      where: {
        id: matchId,
        status: MatchStatus.PENDING_CONFIRMATION,
        recordedAt: { gt: latestExpiredRecordedAt(now) },
      },
      data:
        decision === "confirm"
          ? { status: MatchStatus.SCORED, resolvedAt: now, scoredAt: now }
          : { status: MatchStatus.DISPUTED, resolvedAt: now },
    });

    if (count === 0) {
      return false;
    }

    if (decision === "confirm") {
      await awardPoints(tx, matchId, now);
    }

    return true;
  });

  if (changed) {
    return decision === "confirm"
      ? { outcome: "confirmed" }
      : { outcome: "disputed" };
  }

  // nula redaka znači ili da je netko odlučio prvi ili da je rok prošao
  await expireDueMatches({ matchId }, now);

  const current = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { status: true },
  });

  return current.status === MatchStatus.EXPIRED
    ? { outcome: "deadline-passed" }
    : { outcome: "already-decided", status: current.status };
}

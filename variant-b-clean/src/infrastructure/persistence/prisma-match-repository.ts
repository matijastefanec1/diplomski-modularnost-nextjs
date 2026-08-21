import {
  MatchSide as PrismaMatchSide,
  MatchStatus as PrismaMatchStatus,
  type Prisma,
} from "@/generated/prisma/client";
import type {
  MatchRepository,
  NewMatch,
  ExpiryScope,
  MatchDecisionContext,
  MatchDecisionUpdate,
  MatchScoringInputs,
} from "@/src/application/ports/match-repository";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import type {
  MatchStatus,
  DecidedMatchStatus,
  MatchParticipant,
  MatchDetails,
  MatchHistoryEntry,
} from "@/src/domain/match/match";
import type {
  MatchSide,
  SetScore,
  MatchSets,
} from "@/src/domain/match/match-result";
import type {
  PlayerScoringInput,
  MatchSidePlayers,
  PointsAward,
} from "@/src/domain/scoring/points";

import { prisma } from "./prisma";

const prismaSide: Record<MatchSide, PrismaMatchSide> = {
  A: PrismaMatchSide.A,
  B: PrismaMatchSide.B,
};

const domainStatus: Record<PrismaMatchStatus, MatchStatus> = {
  [PrismaMatchStatus.PENDING_CONFIRMATION]: "PENDING_CONFIRMATION",
  [PrismaMatchStatus.SCORED]: "SCORED",
  [PrismaMatchStatus.DISPUTED]: "DISPUTED",
  [PrismaMatchStatus.EXPIRED]: "EXPIRED",
};

const domainSide: Record<PrismaMatchSide, MatchSide> = {
  [PrismaMatchSide.A]: "A",
  [PrismaMatchSide.B]: "B",
};

const prismaDecidedStatus: Record<DecidedMatchStatus, PrismaMatchStatus> = {
  SCORED: PrismaMatchStatus.SCORED,
  DISPUTED: PrismaMatchStatus.DISPUTED,
};

function scopeFilter(scope: ExpiryScope) {
  return "matchId" in scope
    ? { id: scope.matchId }
    : { participants: { some: { playerId: scope.playerId } } };
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

export class PrismaMatchRepository implements MatchRepository {
  constructor(private readonly db: Prisma.TransactionClient = prisma) {}

  async create(match: NewMatch): Promise<{ id: string }> {
    const row = await this.db.match.create({
      data: {
        reporterId: match.reporterId,
        participants: {
          create: match.participants.map((participant) => ({
            playerId: participant.playerId,
            side: prismaSide[participant.side],
          })),
        },
        sets: {
          create: match.sets.map((score, index) => ({
            setNumber: index + 1,
            teamAGames: score.teamAGames,
            teamBGames: score.teamBGames,
          })),
        },
      },
      select: { id: true },
    });
    return { id: row.id };
  }

  async findDetails(matchId: string): Promise<MatchDetails | null> {
    const match = await this.db.match.findUnique({
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

    const sideOf = (side: PrismaMatchSide): MatchParticipant[] =>
      match.participants
        .filter((participant) => participant.side === side)
        .map((participant) => participant.player);

    return {
      id: match.id,
      status: domainStatus[match.status],
      recordedAt: match.recordedAt,
      teamA: sideOf(PrismaMatchSide.A),
      teamB: sideOf(PrismaMatchSide.B),
      sets: match.sets,
    };
  }

  async findPlayerHistory(playerId: string): Promise<MatchHistoryEntry[]> {
    const matches = await this.db.match.findMany({
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
      status: domainStatus[match.status],
      recordedAt: match.recordedAt,
      participants: match.participants.map((participant) => ({
        id: participant.player.id,
        name: participant.player.name,
        side: domainSide[participant.side],
      })),
      sets: match.sets,
    }));
  }

  async expireDueMatches(
    scope: ExpiryScope,
    recordedAtBound: Date,
  ): Promise<number> {
    const dueMatches = await this.db.match.findMany({
      where: {
        ...scopeFilter(scope),
        status: PrismaMatchStatus.PENDING_CONFIRMATION,
        recordedAt: { lte: recordedAtBound },
      },
      select: { id: true, recordedAt: true },
    });

    let expired = 0;

    // problem s Prismom: resolvedAt je rok tog retka, pa treba označiti jedan po jedan
    for (const match of dueMatches) {
      const { count } = await this.db.match.updateMany({
        where: { id: match.id, status: PrismaMatchStatus.PENDING_CONFIRMATION },
        data: {
          status: PrismaMatchStatus.EXPIRED,
          resolvedAt: decisionDeadlineAt(match.recordedAt),
        },
      });

      expired += count;
    }

    return expired;
  }

  async findDecisionContext(
    matchId: string,
  ): Promise<MatchDecisionContext | null> {
    const match = await this.db.match.findUnique({
      where: { id: matchId },
      select: {
        reporterId: true,
        participants: { select: { playerId: true, side: true } },
      },
    });

    if (!match) {
      return null;
    }
    return {
      reporterId: match.reporterId,
      participants: match.participants.map((participant) => ({
        playerId: participant.playerId,
        side: domainSide[participant.side],
      })),
    };
  }

  async findStatus(matchId: string): Promise<MatchStatus | null> {
    const match = await this.db.match.findUnique({
      where: { id: matchId },
      select: { status: true },
    });

    return match ? domainStatus[match.status] : null;
  }

  async decideIfPending(update: MatchDecisionUpdate): Promise<boolean> {
    const { count } = await this.db.match.updateMany({
      where: {
        id: update.matchId,
        status: PrismaMatchStatus.PENDING_CONFIRMATION,
        recordedAt: { gt: update.recordedAtBound },
      },
      data: {
        status: prismaDecidedStatus[update.status],
        resolvedAt: update.resolvedAt,
        scoredAt: update.scoredAt,
      },
    });

    return count === 1;
  }

  async findScoringInputs(
    matchId: string,
    activityWindowStart: Date,
  ): Promise<MatchScoringInputs> {
    const match = await this.db.match.findUniqueOrThrow({
      where: { id: matchId },
      select: {
        sets: {
          select: { teamAGames: true, teamBGames: true },
          orderBy: { setNumber: "asc" },
        },
        participants: {
          select: {
            playerId: true,
            side: true,
            player: {
              select: {
                points: true,
                _count: {
                  select: {
                    participations: {
                      where: {
                        matchId: { not: matchId },
                        match: {
                          status: PrismaMatchStatus.SCORED,
                          scoredAt: { gte: activityWindowStart },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const sideInputs = (side: PrismaMatchSide): MatchSidePlayers =>
      toSidePlayers(
        match.participants
          .filter((participant) => participant.side === side)
          .map((participant) => ({
            playerId: participant.playerId,
            pointsBefore: participant.player.points,
            scoredMatchesInWindow: participant.player._count.participations,
          })),
        domainSide[side],
        matchId,
      );

    return {
      teamA: sideInputs(PrismaMatchSide.A),
      teamB: sideInputs(PrismaMatchSide.B),
      sets: toMatchSets(match.sets, matchId),
    };
  }

  async awardPoints(
    matchId: string,
    awards: readonly PointsAward[],
  ): Promise<void> {
    for (const award of awards) {
      await this.db.matchParticipant.update({
        where: { matchId_playerId: { matchId, playerId: award.playerId } },
        data: {
          basePoints: award.basePoints,
          activityBonus: award.activityBonus,
          totalPoints: award.totalPoints,
        },
      });
      // bodovi se zbrajaju, drugi upis ne pregazuje prvi!
      await this.db.player.update({
        where: { id: award.playerId },
        data: { points: { increment: award.totalPoints } },
      });
    }
  }
}

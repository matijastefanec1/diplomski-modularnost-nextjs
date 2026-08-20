import { MatchStatus, Prisma } from "@/generated/prisma/client";
import { EmailAlreadyTakenError } from "@/src/application/errors/email-already-taken-error";
import type { PlayerRepository } from "@/src/application/ports/player-repository";
import type {
  NewPlayer,
  PlayerIdentity,
  PlayerCredentials,
  PlayerStanding,
} from "@/src/domain/player/player";

import { prisma } from "./prisma";

const UNIQUE_CONSTRAINT_CODE = "P2002";

// zauzet email hvata se kao greška baze, a kod prevodi grešku u poruku za polje
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_CODE
  );
}

type RankedPlayer = {
  id: string;
  points: number;
  registeredAt: Date;
};

type RankingCriterion = {
  readonly orderBy: Prisma.PlayerOrderByWithRelationInput;
  readonly ahead: (player: RankedPlayer) => Prisma.PlayerWhereInput;
  readonly tied: (player: RankedPlayer) => Prisma.PlayerWhereInput;
};

// pravilo poretka zapisano jednom, iz njega se grade i ORDER BY i COUNT
const rankingCriteria: readonly RankingCriterion[] = [
  {
    orderBy: { points: "desc" },
    ahead: (player) => ({ points: { gt: player.points } }),
    tied: (player) => ({ points: player.points }),
  },
  {
    orderBy: { registeredAt: "asc" },
    ahead: (player) => ({ registeredAt: { lt: player.registeredAt } }),
    tied: (player) => ({ registeredAt: player.registeredAt }),
  },
  {
    orderBy: { id: "asc" },
    ahead: (player) => ({ id: { lt: player.id } }),
    tied: (player) => ({ id: player.id }),
  },
];

const rankingOrderBy = rankingCriteria.map((criterion) => criterion.orderBy);

function playersAheadOf(player: RankedPlayer): Prisma.PlayerWhereInput {
  return {
    OR: rankingCriteria.map((criterion, index) => ({
      AND: [
        ...rankingCriteria
          .slice(0, index)
          .map((stronger) => stronger.tied(player)),
        criterion.ahead(player),
      ],
    })),
  };
}

const scoredMatchCountSelection = {
  select: {
    participations: { where: { match: { status: MatchStatus.SCORED } } },
  },
} satisfies Prisma.PlayerCountOutputTypeDefaultArgs;

export class PrismaPlayerRepository implements PlayerRepository {
  async findCredentialsByEmail(
    email: string,
  ): Promise<PlayerCredentials | null> {
    const row = await prisma.player.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true },
    });

    if (row === null) {
      return null;
    }

    return { id: row.id, name: row.name, passwordHash: row.passwordHash };
  }

  async create(player: NewPlayer): Promise<PlayerIdentity> {
    try {
      // početnih 1000 bodova dolazi iz sheme, ne iz koda!
      const row = await prisma.player.create({
        data: {
          name: player.name,
          email: player.email,
          passwordHash: player.passwordHash,
        },
        select: { id: true, name: true },
      });

      return { id: row.id, name: row.name };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new EmailAlreadyTakenError();
      }

      throw error;
    }
  }

  async findStandingById(playerId: string): Promise<PlayerStanding | null> {
    const row = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        points: true,
        registeredAt: true,
        _count: scoredMatchCountSelection,
      },
    });

    if (row === null) {
      return null;
    }

    const playersAhead = await prisma.player.count({
      where: playersAheadOf(row),
    });

    return {
      id: row.id,
      name: row.name,
      points: row.points,
      scoredMatchCount: row._count.participations,
      rank: playersAhead + 1,
    };
  }

  async listIdentitiesExcept(
    excludedPlayerId: string,
  ): Promise<PlayerIdentity[]> {
    const rows = await prisma.player.findMany({
      where: { id: { not: excludedPlayerId } },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });

    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  async findExistingIds(playerIds: readonly string[]): Promise<string[]> {
    const rows = await prisma.player.findMany({
      where: { id: { in: [...playerIds] } },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }

  async listStandings(): Promise<PlayerStanding[]> {
    const rows = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        points: true,
        _count: scoredMatchCountSelection,
      },
      orderBy: rankingOrderBy,
    });

    return rows.map((row, index) => ({
      id: row.id,
      name: row.name,
      points: row.points,
      scoredMatchCount: row._count.participations,
      rank: index + 1,
    }));
  }
}

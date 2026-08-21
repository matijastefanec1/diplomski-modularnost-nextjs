import { EmailAlreadyTakenError } from "@/src/application/errors/email-already-taken-error";
import type { Clock } from "@/src/application/ports/clock";
import type {
  MatchRepository,
  NewMatch,
  ExpiryScope,
  MatchDecisionContext,
  MatchDecisionUpdate,
  MatchScoringInputs,
} from "@/src/application/ports/match-repository";
import type { PasswordHasher } from "@/src/application/ports/password-hasher";
import type { PlayerRepository } from "@/src/application/ports/player-repository";
import type {
  UnitOfWork,
  TransactionalRepositories,
} from "@/src/application/ports/unit-of-work";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import type {
  MatchStatus,
  MatchDetails,
  MatchHistoryEntry,
} from "@/src/domain/match/match";
import type {
  MatchSide,
  MatchSets,
} from "@/src/domain/match/match-result";
import type {
  PlayerScoringInput,
  MatchSidePlayers,
  PointsAward,
} from "@/src/domain/scoring/points";
import type {
  NewPlayer,
  PlayerIdentity,
  PlayerCredentials,
  PlayerStanding,
} from "@/src/domain/player/player";

export class InMemoryPlayerRepository implements PlayerRepository {
  readonly stored: (NewPlayer & { id: string })[] = [];

  readonly standings: PlayerStanding[] = [];

  standingLookups = 0;

  private nextId = 1;

  async findCredentialsByEmail(
    email: string,
  ): Promise<PlayerCredentials | null> {
    const player = this.stored.find((candidate) => candidate.email === email);

    return player
      ? { id: player.id, name: player.name, passwordHash: player.passwordHash }
      : null;
  }

  async create(player: NewPlayer): Promise<PlayerIdentity> {
    if (this.stored.some((candidate) => candidate.email === player.email)) {
      throw new EmailAlreadyTakenError();
    }

    const stored = { ...player, id: `player-${this.nextId++}` };

    this.stored.push(stored);

    return { id: stored.id, name: stored.name };
  }

  async findStandingById(playerId: string): Promise<PlayerStanding | null> {
    this.standingLookups += 1;

    return this.standings.find((standing) => standing.id === playerId) ?? null;
  }

  async listStandings(): Promise<PlayerStanding[]> {
    return [...this.standings];
  }

  async listIdentitiesExcept(
    excludedPlayerId: string,
  ): Promise<PlayerIdentity[]> {
    return this.stored
      .filter((player) => player.id !== excludedPlayerId)
      .map((player) => ({ id: player.id, name: player.name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async findExistingIds(playerIds: readonly string[]): Promise<string[]> {
    return this.stored
      .map((player) => player.id)
      .filter((id) => playerIds.includes(id));
  }
}

export type DecidableMatch = {
  readonly id: string;
  readonly reporterId: string;
  readonly recordedAt: Date;
  readonly participants: readonly { playerId: string; side: MatchSide }[];
  readonly sets: MatchSets;
  status: MatchStatus;
  resolvedAt: Date | null;
  scoredAt: Date | null;
};

export class InMemoryMatchRepository implements MatchRepository {
  readonly decidable: DecidableMatch[] = [];

  readonly points = new Map<string, number>();

  readonly scoredMatchesInWindow = new Map<string, number>();

  readonly decisionUpdates: MatchDecisionUpdate[] = [];

  readonly scoringInputCalls: {
    matchId: string;
    activityWindowStart: Date;
  }[] = [];

  readonly awarded: { matchId: string; awards: readonly PointsAward[] }[] = [];

  readonly created: NewMatch[] = [];

  readonly stored: MatchDetails[] = [];

  readonly history: MatchHistoryEntry[] = [];

  readonly expiryCalls: {
    scope: ExpiryScope;
    recordedAtBound: Date;
  }[] = [];

  readonly calls: string[] = [];

  private nextId = 1;

  async create(match: NewMatch): Promise<{ id: string }> {
    this.created.push(match);

    return { id: `match-${this.nextId++}` };
  }

  async findDetails(matchId: string): Promise<MatchDetails | null> {
    this.calls.push("findDetails");

    return this.stored.find((match) => match.id === matchId) ?? null;
  }

  async findPlayerHistory(playerId: string): Promise<MatchHistoryEntry[]> {
    this.calls.push("findPlayerHistory");

    return this.history.filter((match) =>
      match.participants.some((participant) => participant.id === playerId),
    );
  }

  async findDecisionContext(
    matchId: string,
  ): Promise<MatchDecisionContext | null> {
    this.calls.push("findDecisionContext");

    const match = this.decidable.find((candidate) => candidate.id === matchId);

    return match
      ? { reporterId: match.reporterId, participants: match.participants }
      : null;
  }

  async findStatus(matchId: string): Promise<MatchStatus | null> {
    this.calls.push("findStatus");

    const match =
      this.decidable.find((candidate) => candidate.id === matchId) ??
      this.stored.find((candidate) => candidate.id === matchId);

    return match?.status ?? null;
  }

  async decideIfPending(update: MatchDecisionUpdate): Promise<boolean> {
    this.calls.push("decideIfPending");
    this.decisionUpdates.push(update);

    const match = this.decidable.find(
      (candidate) =>
        candidate.id === update.matchId &&
        candidate.status === "PENDING_CONFIRMATION" &&
        candidate.recordedAt.getTime() > update.recordedAtBound.getTime(),
    );

    if (!match) {
      return false;
    }

    match.status = update.status;
    match.resolvedAt = update.resolvedAt;
    match.scoredAt = update.scoredAt;

    return true;
  }

  async findScoringInputs(
    matchId: string,
    activityWindowStart: Date,
  ): Promise<MatchScoringInputs> {
    this.calls.push("findScoringInputs");
    this.scoringInputCalls.push({ matchId, activityWindowStart });

    const match = this.decidable.find((candidate) => candidate.id === matchId);

    if (!match) {
      throw new Error(`No match ${matchId} to score.`);
    }

    const sideInputs = (side: MatchSide): MatchSidePlayers => {
      const players: PlayerScoringInput[] = match.participants
        .filter((participant) => participant.side === side)
        .map((participant) => ({
          playerId: participant.playerId,
          pointsBefore: this.points.get(participant.playerId) ?? 0,
          scoredMatchesInWindow:
            this.scoredMatchesInWindow.get(participant.playerId) ?? 0,
        }));

      return [players[0], players[1]];
    };

    return {
      teamA: sideInputs("A"),
      teamB: sideInputs("B"),
      sets: match.sets,
    };
  }

  async awardPoints(
    matchId: string,
    awards: readonly PointsAward[],
  ): Promise<void> {
    this.calls.push("awardPoints");
    this.awarded.push({ matchId, awards });

    for (const award of awards) {
      this.points.set(
        award.playerId,
        (this.points.get(award.playerId) ?? 0) + award.totalPoints,
      );
    }
  }

  async expireDueMatches(
    scope: ExpiryScope,
    recordedAtBound: Date,
  ): Promise<number> {
    this.calls.push("expireDueMatches");
    this.expiryCalls.push({ scope, recordedAtBound });

    const expiredDecidable: string[] = [];

    for (const match of this.decidable) {
      const inScope =
        "matchId" in scope
          ? match.id === scope.matchId
          : match.participants.some(
              (participant) => participant.playerId === scope.playerId,
            );

      if (
        inScope &&
        match.status === "PENDING_CONFIRMATION" &&
        match.recordedAt.getTime() <= recordedAtBound.getTime()
      ) {
        match.status = "EXPIRED";
        match.resolvedAt = decisionDeadlineAt(match.recordedAt);
        expiredDecidable.push(match.id);
      }
    }

    const expiredIds = new Set([
      ...expiredDecidable,
      ...expireDue(this.stored, recordedAtBound, (match) =>
        "matchId" in scope
          ? match.id === scope.matchId
          : [...match.teamA, ...match.teamB].some(
              (participant) => participant.id === scope.playerId,
            ),
      ),
      ...expireDue(this.history, recordedAtBound, (match) =>
        "matchId" in scope
          ? match.id === scope.matchId
          : match.participants.some(
              (participant) => participant.id === scope.playerId,
            ),
      ),
    ]);

    return expiredIds.size;
  }
}

type ExpirableMatch = {
  readonly id: string;
  readonly status: MatchStatus;
  readonly recordedAt: Date;
};

function expireDue<T extends ExpirableMatch>(
  matches: T[],
  recordedAtBound: Date,
  inScope: (match: T) => boolean,
): string[] {
  const due = matches.filter(
    (match) =>
      inScope(match) &&
      match.status === "PENDING_CONFIRMATION" &&
      match.recordedAt.getTime() <= recordedAtBound.getTime(),
  );

  for (const match of due) {
    matches.splice(matches.indexOf(match), 1, { ...match, status: "EXPIRED" });
  }

  return due.map((match) => match.id);
}

export class InMemoryUnitOfWork implements UnitOfWork {
  runs = 0;

  constructor(private readonly matches: MatchRepository) {}

  async run<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    this.runs += 1;

    return work({ matches: this.matches });
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  set(instant: Date): void {
    this.current = instant;
  }
}

export class ReversingPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return [...plainPassword].reverse().join("");
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return (await this.hash(plainPassword)) === passwordHash;
  }
}

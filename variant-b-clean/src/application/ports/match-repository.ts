import type {
  MatchStatus,
  DecidedMatchStatus,
  MatchDetails,
  MatchHistoryEntry,
} from "../../domain/match/match";
import type { MatchSets, MatchSide } from "../../domain/match/match-result";
import type {
  MatchSidePlayers,
  PointsAward,
} from "../../domain/scoring/points";

export type NewMatchParticipant = {
  playerId: string;
  side: MatchSide;
};

export type NewMatch = {
  reporterId: string;
  participants: readonly NewMatchParticipant[];
  sets: MatchSets;
};

// jedan meč za stranicu meča, igračevi mečevi za povijest profila tog igrača
export type ExpiryScope =
  | { readonly matchId: string }
  | { readonly playerId: string };

export type MatchDecisionContext = {
  readonly reporterId: string;
  readonly participants: readonly NewMatchParticipant[];
};

export type MatchDecisionUpdate = {
  readonly matchId: string;
  readonly status: DecidedMatchStatus;
  readonly resolvedAt: Date;
  readonly scoredAt: Date | null;
  readonly recordedAtBound: Date;
};

export type MatchScoringInputs = {
  readonly teamA: MatchSidePlayers;
  readonly teamB: MatchSidePlayers;
  readonly sets: MatchSets;
};

export interface MatchRepository {
  create(match: NewMatch): Promise<{ id: string }>;

  findDetails(matchId: string): Promise<MatchDetails | null>;

  findPlayerHistory(playerId: string): Promise<MatchHistoryEntry[]>;

  expireDueMatches(
    scope: ExpiryScope,
    recordedAtBound: Date,
  ): Promise<number>;

  findDecisionContext(matchId: string): Promise<MatchDecisionContext | null>;

  findStatus(matchId: string): Promise<MatchStatus | null>;

  decideIfPending(update: MatchDecisionUpdate): Promise<boolean>;

  findScoringInputs(
    matchId: string,
    activityWindowStart: Date,
  ): Promise<MatchScoringInputs>;

  awardPoints(
    matchId: string,
    awards: readonly PointsAward[],
  ): Promise<void>;
}

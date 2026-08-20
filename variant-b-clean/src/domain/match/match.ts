import type { MatchSide, SetScore } from "./match-result";

// vlastita unija umjesto Prisma enuma, da generirani tip ne izađe iz infrastrukture
// varijanta A pušta Prisma enum sve do stranice
export type MatchStatus =
  | "PENDING_CONFIRMATION"
  | "SCORED"
  | "DISPUTED"
  | "EXPIRED";

export type DecidedMatchStatus = Extract<MatchStatus, "SCORED" | "DISPUTED">;

export type MatchParticipant = {
  readonly id: string;
  readonly name: string;
};

export type MatchDetails = {
  readonly id: string;
  readonly status: MatchStatus;
  readonly recordedAt: Date;
  readonly teamA: readonly MatchParticipant[];
  readonly teamB: readonly MatchParticipant[];
  readonly sets: readonly SetScore[];
};

export type MatchHistoryParticipant = MatchParticipant & {
  readonly side: MatchSide;
};

export type MatchHistoryEntry = {
  readonly id: string;
  readonly status: MatchStatus;
  readonly recordedAt: Date;
  readonly participants: readonly MatchHistoryParticipant[];
  readonly sets: readonly SetScore[];
};

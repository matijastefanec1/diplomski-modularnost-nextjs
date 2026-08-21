export { decisionDeadlineAt } from "../domain/match/decision-deadline";
export type {
  MatchStatus,
  MatchParticipant,
  MatchDetails,
  MatchHistoryParticipant,
  MatchHistoryEntry,
} from "../domain/match/match";
export type { MatchDetailsView } from "./use-cases/get-match-details";
export type {
  MatchDecisionState,
  MatchDecisionOutcome,
  MatchDecisionOutcomeName,
} from "./use-cases/decide-match";
export {
  toSetScoreForSide,
  type SetScoreForSide,
} from "../domain/match/set-perspective";
export {
  isValidSetScore,
  deriveSetWinner,
  deriveMatchWinner,
  validateMatchResult,
} from "../domain/match/match-result";
export type {
  MatchSide,
  SetScore,
  MatchSets,
  MatchResultViolation,
} from "../domain/match/match-result";

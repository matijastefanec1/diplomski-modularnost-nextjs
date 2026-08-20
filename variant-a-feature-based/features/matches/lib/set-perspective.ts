import type { MatchSide, SetScore } from "./match-result";

export type SetScoreForSide = {
  readonly ownGames: number;
  readonly opponentGames: number;
};

// na profilu prvi idu gemovi vlasnika profila, na stranici meča ostaje tim A / tim B
export const toSetScoreForSide = (
  score: SetScore,
  side: MatchSide,
): SetScoreForSide => {
  return side === "A"
    ? { ownGames: score.teamAGames, opponentGames: score.teamBGames }
    : { ownGames: score.teamBGames, opponentGames: score.teamAGames };
};

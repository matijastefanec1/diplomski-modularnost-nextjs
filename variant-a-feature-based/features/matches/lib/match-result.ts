export type MatchSide = "A" | "B";

export type SetScore = {
  readonly teamAGames: number;
  readonly teamBGames: number;
};

export type MatchSets =
  | readonly [SetScore, SetScore]
  | readonly [SetScore, SetScore, SetScore];

export type MatchResultViolation =
  | { readonly code: "INVALID_SET_SCORE"; readonly setNumber: number }
  | { readonly code: "THIRD_SET_NOT_ALLOWED"; readonly setNumber: number }
  | { readonly code: "MISSING_THIRD_SET" };

const WIN_AT_SIX = 6;
const MAX_LOSER_GAMES_AT_SIX = 4;
const WIN_AT_SEVEN = 7;
const SETS_TO_WIN_MATCH = 2;
const DECIDING_SET = 3;

// valid rezultati su 6:0 do 6:4, 7:5 i 7:6
export function isValidSetScore({ teamAGames, teamBGames }: SetScore): boolean {
  if (!Number.isInteger(teamAGames) || !Number.isInteger(teamBGames)) {
    return false;
  }

  const winnerGames = Math.max(teamAGames, teamBGames);
  const loserGames = Math.min(teamAGames, teamBGames);

  if (winnerGames === WIN_AT_SIX) {
    return loserGames >= 0 && loserGames <= MAX_LOSER_GAMES_AT_SIX;
  }

  if (winnerGames === WIN_AT_SEVEN) {
    return loserGames === 5 || loserGames === 6;
  }

  return false;
}

export function deriveSetWinner(score: SetScore): MatchSide | null {
  if (!isValidSetScore(score)) {
    return null;
  }
  return score.teamAGames > score.teamBGames ? "A" : "B";
}

// pobjednik nije stupac u bazi, izvodi se iz setova da se ne mogu razići
export function deriveMatchWinner(sets: MatchSets): MatchSide | null {
  let teamAWins = 0;
  let teamBWins = 0;

  for (const score of sets) {
    const winner = deriveSetWinner(score);

    if (winner === null) {
      return null;
    }

    if (winner === "A") {
      teamAWins += 1;
    } else {
      teamBWins += 1;
    }
  }

  if (teamAWins === SETS_TO_WIN_MATCH) {
    return "A";
  }

  if (teamBWins === SETS_TO_WIN_MATCH) {
    return "B";
  }

  return null;
}

export function validateMatchResult(
  sets: MatchSets,
): readonly MatchResultViolation[] {
  const scores: readonly SetScore[] = sets;
  const invalidSets: MatchResultViolation[] = [];

  for (let index = 0; index < scores.length; index += 1) {
    if (!isValidSetScore(scores[index])) {
      invalidSets.push({ code: "INVALID_SET_SCORE", setNumber: index + 1 });
    }
  }

  if (invalidSets.length > 0) {
    return invalidSets;
  }

  const decidedAfterTwoSets =
    deriveSetWinner(sets[0]) === deriveSetWinner(sets[1]);

  // ako su prva dva seta pripala istoj strani, treći ne postoji!
  if (decidedAfterTwoSets && sets.length === DECIDING_SET) {
    return [{ code: "THIRD_SET_NOT_ALLOWED", setNumber: DECIDING_SET }];
  }

  if (!decidedAfterTwoSets && sets.length === SETS_TO_WIN_MATCH) {
    return [{ code: "MISSING_THIRD_SET" }];
  }
  return [];
}

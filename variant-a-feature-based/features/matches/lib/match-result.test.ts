import { describe, expect, it } from "vitest";

import {
  deriveMatchWinner,
  deriveSetWinner,
  isValidSetScore,
  validateMatchResult,
  type MatchSets,
  type SetScore,
} from "./match-result";

function score(teamAGames: number, teamBGames: number): SetScore {
  return { teamAGames, teamBGames };
}

describe("isValidSetScore", () => {
  it.each([0, 1, 2, 3, 4])("accepts 6:%i and its mirror", (loserGames) => {
    expect(isValidSetScore(score(6, loserGames))).toBe(true);
    expect(isValidSetScore(score(loserGames, 6))).toBe(true);
  });

  it("accepts 7:5 in both directions", () => {
    expect(isValidSetScore(score(7, 5))).toBe(true);
    expect(isValidSetScore(score(5, 7))).toBe(true);
  });

  it("accepts 7:6, the tie-break set, in both directions", () => {
    expect(isValidSetScore(score(7, 6))).toBe(true);
    expect(isValidSetScore(score(6, 7))).toBe(true);
  });

  it.each([
    [6, 5],
    [7, 4],
    [6, 6],
  ])("rejects %i:%i and its mirror", (teamAGames, teamBGames) => {
    expect(isValidSetScore(score(teamAGames, teamBGames))).toBe(false);
    expect(isValidSetScore(score(teamBGames, teamAGames))).toBe(false);
  });

  it("rejects scores outside the possible range", () => {
    expect(isValidSetScore(score(8, 6))).toBe(false);
    expect(isValidSetScore(score(5, 3))).toBe(false);
    expect(isValidSetScore(score(-1, 6))).toBe(false);
  });

  it("rejects non-integer games", () => {
    expect(isValidSetScore(score(6, 1.5))).toBe(false);
    expect(isValidSetScore(score(Number.NaN, 6))).toBe(false);
  });
});

describe("deriveSetWinner", () => {
  it("names the side that won the set", () => {
    expect(deriveSetWinner(score(6, 4))).toBe("A");
    expect(deriveSetWinner(score(6, 7))).toBe("B");
  });

  it("a score that is not a possible final score has no winner", () => {
    expect(deriveSetWinner(score(6, 5))).toBeNull();
    expect(deriveSetWinner(score(0, 0))).toBeNull();
  });
});

describe("deriveMatchWinner", () => {
  it("derives the winner of a match decided in two sets", () => {
    expect(deriveMatchWinner([score(6, 4), score(7, 5)])).toBe("A");
    expect(deriveMatchWinner([score(4, 6), score(5, 7)])).toBe("B");
  });

  it("derives the winner of a match decided in three sets", () => {
    expect(deriveMatchWinner([score(6, 4), score(3, 6), score(7, 6)])).toBe("A");
    expect(deriveMatchWinner([score(6, 4), score(3, 6), score(6, 7)])).toBe("B");
  });

  it("two sets at 1:1 leave the match without a winner", () => {
    expect(deriveMatchWinner([score(6, 4), score(3, 6)])).toBeNull();
  });

  it("returns null when a set score is not a possible final score", () => {
    expect(deriveMatchWinner([score(6, 5), score(6, 4)])).toBeNull();
  });
});

describe("validateMatchResult", () => {
  it("accepts a match decided in two sets", () => {
    expect(validateMatchResult([score(6, 4), score(7, 5)])).toEqual([]);
  });

  it("accepts a match decided in three sets", () => {
    expect(
      validateMatchResult([score(6, 4), score(3, 6), score(7, 6)]),
    ).toEqual([]);
  });

  it("reports every invalid set with its set number", () => {
    expect(
      validateMatchResult([score(6, 5), score(6, 4), score(7, 4)]),
    ).toEqual([
      { code: "INVALID_SET_SCORE", setNumber: 1 },
      { code: "INVALID_SET_SCORE", setNumber: 3 },
    ]);
  });

  it("should reject a third set played after a 2:0 lead", () => {
    expect(
      validateMatchResult([score(6, 4), score(6, 3), score(6, 2)]),
    ).toEqual([{ code: "THIRD_SET_NOT_ALLOWED", setNumber: 3 }]);
  });

  it("a match left at 1:1 needs a third set", () => {
    expect(validateMatchResult([score(6, 4), score(3, 6)])).toEqual([
      { code: "MISSING_THIRD_SET" },
    ]);
  });

  it("judges the structure only once every set score is possible", () => {
    const undecidable: MatchSets = [score(6, 4), score(6, 6)];

    expect(validateMatchResult(undecidable)).toEqual([
      { code: "INVALID_SET_SCORE", setNumber: 2 },
    ]);
  });
});

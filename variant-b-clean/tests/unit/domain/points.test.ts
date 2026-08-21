import { describe, it, expect } from "vitest";

import type { MatchSide } from "@/src/domain/match/match-result";
import {
  assignMatchPoints,
  sideStrength,
  type PlayerScoringInput,
} from "@/src/domain/scoring/points";

function player(
  playerId: string,
  pointsBefore: number,
  scoredMatchesInWindow = 0,
): PlayerScoringInput {
  return { playerId, pointsBefore, scoredMatchesInWindow };
}

function match(
  teamAPoints: number,
  teamBPoints: number,
  winningSide: MatchSide,
) {
  return {
    teamA: [player("a1", teamAPoints), player("a2", teamAPoints)] as const,
    teamB: [player("b1", teamBPoints), player("b2", teamBPoints)] as const,
    winningSide,
  };
}

function basePointsOf(
  playerId: string,
  awards: readonly { playerId: string; basePoints: number }[],
) {
  const award = awards.find((candidate) => candidate.playerId === playerId);

  if (award === undefined) {
    throw new Error(`No award for player ${playerId}`);
  }

  return award.basePoints;
}

describe("sideStrength", () => {
  it("averages the two players' points", () => {
    expect(sideStrength([player("a1", 1000), player("a2", 1200)])).toBe(1100);
  });

  it("rounds a half up, so 1000 and 1001 give 1001", () => {
    expect(sideStrength([player("a1", 1000), player("a2", 1001)])).toBe(1001);
  });

  it("rounds a half up regardless of player order", () => {
    expect(sideStrength([player("a1", 1001), player("a2", 1000)])).toBe(1001);
  });
});

describe("assignMatchPoints base points", () => {
  it("awards 30 for a win with R exactly +100", () => {
    const awards = assignMatchPoints(match(1000, 1100, "A"));

    expect(basePointsOf("a1", awards)).toBe(30);
    expect(basePointsOf("a2", awards)).toBe(30);
  });

  it("awards 5 for a loss with R exactly +100", () => {
    const awards = assignMatchPoints(match(1000, 1100, "B"));

    expect(basePointsOf("a1", awards)).toBe(5);
    expect(basePointsOf("b1", awards)).toBe(12);
  });

  it("awards 12 for a win with R exactly -100", () => {
    const awards = assignMatchPoints(match(1100, 1000, "A"));

    expect(basePointsOf("a1", awards)).toBe(12);
  });

  it("awards 0 for a loss with R exactly -100", () => {
    const awards = assignMatchPoints(match(1100, 1000, "B"));

    expect(basePointsOf("a1", awards)).toBe(0);
    expect(basePointsOf("b1", awards)).toBe(30);
  });

  it("treats R just below +100 as a win over similar opponents", () => {
    const awards = assignMatchPoints(match(1000, 1099, "A"));

    expect(basePointsOf("a1", awards)).toBe(20);
  });

  it("treats R just above -100 as a win over similar opponents", () => {
    const awards = assignMatchPoints(match(1099, 1000, "A"));

    expect(basePointsOf("a1", awards)).toBe(20);
  });

  it("gives the losing side nothing when R stays below +100", () => {
    const awards = assignMatchPoints(match(1000, 1099, "B"));

    expect(basePointsOf("a1", awards)).toBe(0);
  });

  it("gives every player of a side the full amount, undivided", () => {
    const awards = assignMatchPoints(match(1000, 1000, "A"));

    expect(basePointsOf("a1", awards)).toBe(20);
    expect(basePointsOf("a2", awards)).toBe(20);
  });
});

describe("assignMatchPoints activity bonus", () => {
  it("gives no bonus when the scored match is only the second in the window", () => {
    const awards = assignMatchPoints({
      teamA: [player("a1", 1000, 1), player("a2", 1000, 0)],
      teamB: [player("b1", 1000, 0), player("b2", 1000, 0)],
      winningSide: "A",
    });

    expect(awards[0]).toEqual({
      playerId: "a1",
      basePoints: 20,
      activityBonus: 0,
      totalPoints: 20,
    });
  });

  it("gives +5 when the scored match is the third in the window", () => {
    const awards = assignMatchPoints({
      teamA: [player("a1", 1000, 2), player("a2", 1000, 0)],
      teamB: [player("b1", 1000, 0), player("b2", 1000, 0)],
      winningSide: "A",
    });

    expect(awards[0]).toEqual({
      playerId: "a1",
      basePoints: 20,
      activityBonus: 5,
      totalPoints: 25,
    });
  });

  it("gives +5 to a losing player who earns no base points", () => {
    const awards = assignMatchPoints({
      teamA: [player("a1", 1000, 4), player("a2", 1000, 0)],
      teamB: [player("b1", 1000, 0), player("b2", 1000, 0)],
      winningSide: "B",
    });

    expect(awards[0]).toEqual({
      playerId: "a1",
      basePoints: 0,
      activityBonus: 5,
      totalPoints: 5,
    });
  });
});

describe("assignMatchPoints output", () => {
  it("returns one award per player, team A first", () => {
    const awards = assignMatchPoints(match(1000, 1000, "A"));

    expect(awards.map((award) => award.playerId)).toEqual([
      "a1",
      "a2",
      "b1",
      "b2",
    ]);
  });

  it("never returns a negative amount, so points cannot fall", () => {
    const awards = assignMatchPoints(match(1100, 1000, "B"));

    for (const award of awards) {
      expect(award.basePoints).toBeGreaterThanOrEqual(0);
      expect(award.activityBonus).toBeGreaterThanOrEqual(0);
      expect(award.totalPoints).toBe(award.basePoints + award.activityBonus);
    }
  });
});

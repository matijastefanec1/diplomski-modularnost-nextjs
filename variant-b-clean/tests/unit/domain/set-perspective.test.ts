import { describe, it, expect } from "vitest";

import { toSetScoreForSide } from "@/src/domain/match/set-perspective";

const SET_SCORE = { teamAGames: 6, teamBGames: 4 };

describe("toSetScoreForSide", () => {
  it("keeps the stored direction for side A", () => {
    expect(toSetScoreForSide(SET_SCORE, "A")).toEqual({
      ownGames: 6,
      opponentGames: 4,
    });
  });

  it("mirrors the games for side B", () => {
    expect(toSetScoreForSide(SET_SCORE, "B")).toEqual({
      ownGames: 4,
      opponentGames: 6,
    });
  });
});

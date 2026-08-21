import { describe, it, expect } from "vitest";

import {
  DUPLICATE_PLAYER_MESSAGE,
  MISSING_THIRD_SET_MESSAGE,
  OPPONENT_REQUIRED_MESSAGE,
  PARTNER_REQUIRED_MESSAGE,
  recordMatchSchema,
  SET_GAMES_MISSING_MESSAGE,
  SET_SCORE_INVALID_MESSAGE,
  THIRD_SET_NOT_ALLOWED_MESSAGE,
  toRecordMatchFieldErrors,
  UNKNOWN_PLAYER_MESSAGE,
  type RecordMatchFormState,
  type RecordMatchSubmission,
} from "./record-match-schema";

const REPORTER_ID = "11111111-1111-4111-8111-111111111111";
const PARTNER_ID = "22222222-2222-4222-8222-222222222222";
const OPPONENT_ONE_ID = "33333333-3333-4333-8333-333333333333";
const OPPONENT_TWO_ID = "44444444-4444-4444-8444-444444444444";

function submission(
  overrides: Partial<RecordMatchSubmission> = {},
): RecordMatchSubmission {
  return {
    partnerId: PARTNER_ID,
    opponentOneId: OPPONENT_ONE_ID,
    opponentTwoId: OPPONENT_TWO_ID,
    set1Own: "6",
    set1Opponent: "4",
    set2Own: "7",
    set2Opponent: "5",
    set3Own: "",
    set3Opponent: "",
    ...overrides,
  };
}

function errorsFor(
  overrides: Partial<RecordMatchSubmission> = {},
): RecordMatchFormState["errors"] {
  const parsed = recordMatchSchema(REPORTER_ID).safeParse(
    submission(overrides),
  );

  if (parsed.success) {
    return {};
  }

  return toRecordMatchFieldErrors(parsed.error.issues);
}

describe("recordMatchSchema participants", () => {
  it("accepts three distinct players and returns their ids", () => {
    const parsed = recordMatchSchema(REPORTER_ID).safeParse(submission());

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.partnerId).toBe(PARTNER_ID);
    expect(parsed.success && parsed.data.opponentOneId).toBe(OPPONENT_ONE_ID);
    expect(parsed.success && parsed.data.opponentTwoId).toBe(OPPONENT_TWO_ID);
  });

  it("asks for a partner that was never chosen", () => {
    expect(errorsFor({ partnerId: "" })).toEqual({
      partner: PARTNER_REQUIRED_MESSAGE,
    });
  });

  it("asks for an opponent that was never chosen", () => {
    expect(errorsFor({ opponentTwoId: "" })).toEqual({
      opponentTwo: OPPONENT_REQUIRED_MESSAGE,
    });
  });

  it("rejects the same player twice", () => {
    expect(errorsFor({ opponentTwoId: OPPONENT_ONE_ID })).toEqual({
      opponentTwo: DUPLICATE_PLAYER_MESSAGE,
    });
  });

  it("rejects the reporter choosing themselves, who already plays for team A", () => {
    expect(errorsFor({ partnerId: REPORTER_ID })).toEqual({
      partner: DUPLICATE_PLAYER_MESSAGE,
    });
  });

  it("rejects an identifier that cannot be a player id, before any query", () => {
    expect(errorsFor({ partnerId: "nije-uuid" })).toEqual({
      partner: UNKNOWN_PLAYER_MESSAGE,
    });
  });
});

describe("recordMatchSchema sets", () => {
  it("accepts a match decided in two sets", () => {
    const parsed = recordMatchSchema(REPORTER_ID).safeParse(submission());

    expect(parsed.success && parsed.data.sets).toEqual([
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 7, teamBGames: 5 },
    ]);
  });

  it("accepts a match decided in three sets", () => {
    const parsed = recordMatchSchema(REPORTER_ID).safeParse(
      submission({
        set2Own: "3",
        set2Opponent: "6",
        set3Own: "7",
        set3Opponent: "6",
      }),
    );

    expect(parsed.success && parsed.data.sets).toEqual([
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 3, teamBGames: 6 },
      { teamAGames: 7, teamBGames: 6 },
    ]);
  });

  it("asks for both game counts when one is missing", () => {
    expect(errorsFor({ set1Opponent: "" })).toEqual({
      set1: SET_GAMES_MISSING_MESSAGE,
    });
  });

  it("asks for both game counts when one is not a number", () => {
    expect(errorsFor({ set2Own: "šest" })).toEqual({
      set2: SET_GAMES_MISSING_MESSAGE,
    });
  });

  it("asks for both game counts when only half of the third set is filled", () => {
    expect(
      errorsFor({ set2Own: "3", set2Opponent: "6", set3Own: "6" }),
    ).toEqual({ set3: SET_GAMES_MISSING_MESSAGE });
  });

  it.each([
    ["6", "5"],
    ["7", "4"],
    ["6", "6"],
    ["8", "6"],
  ])("rejects the set score %s:%s", (own, opponent) => {
    expect(errorsFor({ set1Own: own, set1Opponent: opponent })).toEqual({
      set1: SET_SCORE_INVALID_MESSAGE,
    });
  });

  it("should not accept a third set after a 2:0 lead", () => {
    expect(
      errorsFor({ set2Own: "6", set2Opponent: "3", set3Own: "6", set3Opponent: "2" }),
    ).toEqual({ set3: THIRD_SET_NOT_ALLOWED_MESSAGE });
  });

  it("a match left at 1:1 without a third set is incomplete", () => {
    expect(errorsFor({ set2Own: "3", set2Opponent: "6" })).toEqual({
      set3: MISSING_THIRD_SET_MESSAGE,
    });
  });

  it("reports an invalid set on its own, without judging the structure", () => {
    expect(errorsFor({ set2Own: "6", set2Opponent: "6" })).toEqual({
      set2: SET_SCORE_INVALID_MESSAGE,
    });
  });
});

describe("toRecordMatchFieldErrors", () => {
  it("only the first message per field survives", () => {
    const errors = toRecordMatchFieldErrors([
      { path: ["set1Own"], message: SET_SCORE_INVALID_MESSAGE },
      { path: ["set1Opponent"], message: SET_GAMES_MISSING_MESSAGE },
    ]);

    expect(errors).toEqual({ set1: SET_SCORE_INVALID_MESSAGE });
  });

  it("ignores issues that belong to no contracted field", () => {
    expect(
      toRecordMatchFieldErrors([{ path: ["unknown"], message: "x" }]),
    ).toEqual({});
  });
});

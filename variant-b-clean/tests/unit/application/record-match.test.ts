import { describe, beforeEach, it, expect } from "vitest";

import type { MatchSets } from "@/src/domain/match/match-result";
import { RecordMatch } from "@/src/application/use-cases/record-match";

import {
  InMemoryMatchRepository,
  InMemoryPlayerRepository,
} from "../../support/player-doubles";

const REPORTER_ID = "11111111-1111-4111-8111-111111111111";
const PARTNER_ID = "22222222-2222-4222-8222-222222222222";
const OPPONENT_ONE_ID = "33333333-3333-4333-8333-333333333333";
const OPPONENT_TWO_ID = "44444444-4444-4444-8444-444444444444";
const STRANGER_ID = "55555555-5555-4555-8555-555555555555";

const TWO_SETS: MatchSets = [
  { teamAGames: 6, teamBGames: 4 },
  { teamAGames: 7, teamBGames: 5 },
];

let players: InMemoryPlayerRepository;
let matches: InMemoryMatchRepository;
let recordMatch: RecordMatch;

function storePlayer(id: string, name: string) {
  players.stored.push({
    id,
    name,
    email: `${name}@mail.com`,
    passwordHash: "hash",
  });
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    reporterId: REPORTER_ID,
    partnerId: PARTNER_ID,
    opponentOneId: OPPONENT_ONE_ID,
    opponentTwoId: OPPONENT_TWO_ID,
    sets: TWO_SETS,
    ...overrides,
  };
}

beforeEach(() => {
  players = new InMemoryPlayerRepository();
  matches = new InMemoryMatchRepository();
  recordMatch = new RecordMatch(matches, players);

  storePlayer(REPORTER_ID, "Ana");
  storePlayer(PARTNER_ID, "Ivan");
  storePlayer(OPPONENT_ONE_ID, "Marko");
  storePlayer(OPPONENT_TWO_ID, "Petra");
});

describe("RecordMatch", () => {
  it("records the match and reports its identifier", async () => {
    const result = await recordMatch.execute(input());

    expect(result).toEqual({ status: "recorded", matchId: "match-1" });
  });

  it("puts the reporter and the partner on team A, the opponents on team B", async () => {
    await recordMatch.execute(input());

    expect(matches.created[0]).toEqual({
      reporterId: REPORTER_ID,
      participants: [
        { playerId: REPORTER_ID, side: "A" },
        { playerId: PARTNER_ID, side: "A" },
        { playerId: OPPONENT_ONE_ID, side: "B" },
        { playerId: OPPONENT_TWO_ID, side: "B" },
      ],
      sets: TWO_SETS,
    });
  });

  it("rejects the same player chosen twice", async () => {
    const result = await recordMatch.execute(
      input({ opponentTwoId: OPPONENT_ONE_ID }),
    );

    expect(result).toEqual({
      status: "duplicate-players",
      playerIds: [OPPONENT_ONE_ID],
    });
    expect(matches.created).toHaveLength(0);
  });

  it("rejects the reporter choosing themselves, who already plays for team A", async () => {
    const result = await recordMatch.execute(input({ partnerId: REPORTER_ID }));

    expect(result).toEqual({
      status: "duplicate-players",
      playerIds: [REPORTER_ID],
    });
  });

  it("rejects a player nobody holds", async () => {
    const result = await recordMatch.execute(
      input({ opponentTwoId: STRANGER_ID }),
    );

    expect(result).toEqual({
      status: "unknown-players",
      playerIds: [STRANGER_ID],
    });
    expect(matches.created).toHaveLength(0);
  });

  it("answers a malformed identifier without querying, as the profile route does", async () => {
    const result = await recordMatch.execute(input({ partnerId: "nije-uuid" }));

    expect(result).toEqual({
      status: "unknown-players",
      playerIds: ["nije-uuid"],
    });
  });

  it("rejects a set score that is not a possible final score", async () => {
    const result = await recordMatch.execute(
      input({
        sets: [
          { teamAGames: 6, teamBGames: 5 },
          { teamAGames: 6, teamBGames: 4 },
        ],
      }),
    );

    expect(result).toEqual({
      status: "invalid-result",
      violations: [{ code: "INVALID_SET_SCORE", setNumber: 1 }],
    });
    expect(matches.created).toHaveLength(0);
  });

  it("a match left at 1:1 without a third set is incomplete", async () => {
    const result = await recordMatch.execute(
      input({
        sets: [
          { teamAGames: 6, teamBGames: 4 },
          { teamAGames: 3, teamBGames: 6 },
        ],
      }),
    );

    expect(result).toEqual({
      status: "invalid-result",
      violations: [{ code: "MISSING_THIRD_SET" }],
    });
  });

  it("should not accept a third set after a 2:0 lead", async () => {
    const result = await recordMatch.execute(
      input({
        sets: [
          { teamAGames: 6, teamBGames: 4 },
          { teamAGames: 6, teamBGames: 3 },
          { teamAGames: 6, teamBGames: 2 },
        ],
      }),
    );

    expect(result).toEqual({
      status: "invalid-result",
      violations: [{ code: "THIRD_SET_NOT_ALLOWED", setNumber: 3 }],
    });
  });

  it("records a match decided in three sets", async () => {
    const threeSets: MatchSets = [
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 3, teamBGames: 6 },
      { teamAGames: 7, teamBGames: 6 },
    ];

    const result = await recordMatch.execute(input({ sets: threeSets }));

    expect(result.status).toBe("recorded");
    expect(matches.created[0].sets).toEqual(threeSets);
  });
});

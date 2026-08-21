import { describe, beforeEach, it, expect } from "vitest";

import { GetMatchDetails } from "@/src/application/use-cases/get-match-details";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import type { MatchDetails } from "@/src/domain/match/match";

import { FixedClock, InMemoryMatchRepository } from "../../support/player-doubles";

const DUE_MATCH_ID = "ffffffff-0000-4000-8000-000000000001";
const FRESH_MATCH_ID = "ffffffff-0000-4000-8000-000000000002";
const UNKNOWN_MATCH_ID = "ffffffff-0000-4000-8000-00000000dead";

const NOW = new Date("2026-08-13T12:00:00.000Z");
const DUE_RECORDED_AT = new Date(NOW.getTime() - 50 * 60 * 60 * 1000);
const FRESH_RECORDED_AT = new Date(NOW.getTime() - 47 * 60 * 60 * 1000);

let matches: InMemoryMatchRepository;
let clock: FixedClock;
let getMatchDetails: GetMatchDetails;

function storeMatch(id: string, recordedAt: Date): MatchDetails {
  const match: MatchDetails = {
    id,
    status: "PENDING_CONFIRMATION",
    recordedAt,
    teamA: [
      { id: "player-1", name: "Ana" },
      { id: "player-2", name: "Ivan" },
    ],
    teamB: [
      { id: "player-3", name: "Marko" },
      { id: "player-4", name: "Petra" },
    ],
    sets: [
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 7, teamBGames: 5 },
    ],
  };

  matches.stored.push(match);

  return match;
}

beforeEach(() => {
  matches = new InMemoryMatchRepository();
  clock = new FixedClock(NOW);
  getMatchDetails = new GetMatchDetails(matches, clock);

  storeMatch(DUE_MATCH_ID, DUE_RECORDED_AT);
  storeMatch(FRESH_MATCH_ID, FRESH_RECORDED_AT);
});

describe("GetMatchDetails", () => {
  it("translates due matches before reading them", async () => {
    const details = await getMatchDetails.execute(DUE_MATCH_ID);

    expect(details?.match.status).toBe("EXPIRED");
    expect(matches.calls).toEqual(["expireDueMatches", "findDetails"]);
  });

  it("leaves a match whose window is still open alone", async () => {
    const details = await getMatchDetails.execute(FRESH_MATCH_ID);

    expect(details?.match.status).toBe("PENDING_CONFIRMATION");
  });

  it("translates only inside the scope of the read that triggered it", async () => {
    await getMatchDetails.execute(DUE_MATCH_ID);

    expect(matches.expiryCalls).toHaveLength(1);
    expect(matches.expiryCalls[0].scope).toEqual({ matchId: DUE_MATCH_ID });
  });

  it("derives the deadline bound from the clock, not from the repository", async () => {
    await getMatchDetails.execute(DUE_MATCH_ID);

    expect(decisionDeadlineAt(matches.expiryCalls[0].recordedAtBound)).toEqual(
      NOW,
    );
  });

  it("hands back the instant it read at, so the countdown cannot disagree", async () => {
    const details = await getMatchDetails.execute(FRESH_MATCH_ID);

    expect(details?.now).toEqual(NOW);
  });

  it("follows the clock rather than the wall clock", async () => {
    clock.set(new Date(NOW.getTime() - 3 * 60 * 60 * 1000));

    expect((await getMatchDetails.execute(DUE_MATCH_ID))?.match.status).toBe(
      "PENDING_CONFIRMATION",
    );

    clock.set(new Date(NOW.getTime() + 60 * 60 * 1000));

    expect((await getMatchDetails.execute(FRESH_MATCH_ID))?.match.status).toBe(
      "EXPIRED",
    );
  });

  it("answers a malformed identifier without touching the repository", async () => {
    expect(await getMatchDetails.execute("nije-uuid")).toBeNull();
    expect(matches.calls).toEqual([]);
  });

  it("answers null for a match nobody holds", async () => {
    expect(await getMatchDetails.execute(UNKNOWN_MATCH_ID)).toBeNull();
  });
});

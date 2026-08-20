import { describe, beforeEach, it, expect } from "vitest";

import { GetPlayerMatchHistory } from "@/src/application/use-cases/get-player-match-history";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import type { MatchHistoryEntry } from "@/src/domain/match/match";

import { FixedClock, InMemoryMatchRepository } from "../../support/player-doubles";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const PARTNER_ID = "22222222-2222-4222-8222-222222222222";
const OPPONENT_ONE_ID = "33333333-3333-4333-8333-333333333333";
const OPPONENT_TWO_ID = "44444444-4444-4444-8444-444444444444";
const STRANGER_ID = "55555555-5555-4555-8555-555555555555";

const NOW = new Date("2026-08-13T12:00:00.000Z");
const DUE_RECORDED_AT = new Date(NOW.getTime() - 50 * 60 * 60 * 1000);
const FRESH_RECORDED_AT = new Date(NOW.getTime() - 47 * 60 * 60 * 1000);

let matches: InMemoryMatchRepository;
let clock: FixedClock;
let getPlayerMatchHistory: GetPlayerMatchHistory;

function storeMatch(
  id: string,
  recordedAt: Date,
  participantIds: readonly string[],
): void {
  const entry: MatchHistoryEntry = {
    id,
    status: "PENDING_CONFIRMATION",
    recordedAt,
    participants: participantIds.map((playerId, index) => ({
      id: playerId,
      name: `Player ${playerId.slice(0, 1)}`,
      side: index < 2 ? "A" : "B",
    })),
    sets: [
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 7, teamBGames: 5 },
    ],
  };

  matches.history.push(entry);
}

beforeEach(() => {
  matches = new InMemoryMatchRepository();
  clock = new FixedClock(NOW);
  getPlayerMatchHistory = new GetPlayerMatchHistory(matches, clock);

  storeMatch("match-fresh", FRESH_RECORDED_AT, [
    OWNER_ID,
    PARTNER_ID,
    OPPONENT_ONE_ID,
    OPPONENT_TWO_ID,
  ]);
  storeMatch("match-due", DUE_RECORDED_AT, [
    OWNER_ID,
    PARTNER_ID,
    OPPONENT_ONE_ID,
    OPPONENT_TWO_ID,
  ]);
  storeMatch("match-strangers", DUE_RECORDED_AT, [
    PARTNER_ID,
    OPPONENT_ONE_ID,
    OPPONENT_TWO_ID,
    STRANGER_ID,
  ]);
});

describe("GetPlayerMatchHistory", () => {
  it("translates due matches before reading them", async () => {
    const history = await getPlayerMatchHistory.execute(OWNER_ID);

    expect(
      history.find((entry) => entry.id === "match-due")?.status,
    ).toBe("EXPIRED");
    expect(
      history.find((entry) => entry.id === "match-fresh")?.status,
    ).toBe("PENDING_CONFIRMATION");
    expect(matches.calls).toEqual(["expireDueMatches", "findPlayerHistory"]);
  });

  it("translates in the scope of the player, not of a single match", async () => {
    await getPlayerMatchHistory.execute(OWNER_ID);

    expect(matches.expiryCalls).toHaveLength(1);
    expect(matches.expiryCalls[0].scope).toEqual({ playerId: OWNER_ID });
  });

  it("leaves an equally due match of other players alone", async () => {
    await getPlayerMatchHistory.execute(OWNER_ID);

    expect(
      matches.history.find((entry) => entry.id === "match-strangers")?.status,
    ).toBe("PENDING_CONFIRMATION");
  });

  it("derives the deadline bound from the clock", async () => {
    await getPlayerMatchHistory.execute(OWNER_ID);

    expect(decisionDeadlineAt(matches.expiryCalls[0].recordedAtBound)).toEqual(
      NOW,
    );
  });

  it("follows the clock rather than the wall clock", async () => {
    clock.set(new Date(NOW.getTime() - 3 * 60 * 60 * 1000));

    const history = await getPlayerMatchHistory.execute(OWNER_ID);

    expect(history.every((entry) => entry.status === "PENDING_CONFIRMATION")).toBe(
      true,
    );
  });

  it("hands over the repository's order untouched", async () => {
    const history = await getPlayerMatchHistory.execute(OWNER_ID);

    expect(history.map((entry) => entry.id)).toEqual([
      "match-fresh",
      "match-due",
    ]);
  });

  it("answers with an empty history for a player without matches", async () => {
    await expect(getPlayerMatchHistory.execute("no-such-player")).resolves.toEqual(
      [],
    );
  });
});

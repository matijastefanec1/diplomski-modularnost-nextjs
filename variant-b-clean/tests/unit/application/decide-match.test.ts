import { beforeEach, describe, expect, it } from "vitest";

import { ConfirmMatch } from "@/src/application/use-cases/confirm-match";
import { DecideMatch } from "@/src/application/use-cases/decide-match";
import { DisputeMatch } from "@/src/application/use-cases/dispute-match";
import { decisionDeadlineAt } from "@/src/domain/match/decision-deadline";
import { activityWindowStart } from "@/src/domain/scoring/activity-window";
import { assignMatchPoints } from "@/src/domain/scoring/points";

import {
  FixedClock,
  InMemoryMatchRepository,
  InMemoryUnitOfWork,
  type DecidableMatch,
} from "../../support/player-doubles";

const OPEN_MATCH_ID = "ffffffff-0000-4000-8000-000000000001";
const DUE_MATCH_ID = "ffffffff-0000-4000-8000-000000000002";
const UNKNOWN_MATCH_ID = "ffffffff-0000-4000-8000-00000000dead";

const REPORTER_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const PARTNER_ID = "aaaaaaaa-0000-4000-8000-000000000002";
const OPPONENT_ID = "aaaaaaaa-0000-4000-8000-000000000003";
const OTHER_OPPONENT_ID = "aaaaaaaa-0000-4000-8000-000000000004";
const STRANGER_ID = "aaaaaaaa-0000-4000-8000-000000000009";

const NOW = new Date("2026-08-13T12:00:00.000Z");
const OPEN_RECORDED_AT = new Date(NOW.getTime() - 60 * 60 * 1000);
const DUE_RECORDED_AT = new Date(NOW.getTime() - 50 * 60 * 60 * 1000);

const STARTING_POINTS = 1000;
const WIN_VS_SIMILAR = 20;
const ACTIVITY_BONUS = 5;

let matches: InMemoryMatchRepository;
let unitOfWork: InMemoryUnitOfWork;
let clock: FixedClock;
let confirmMatch: ConfirmMatch;
let disputeMatch: DisputeMatch;

function storeMatch(id: string, recordedAt: Date): DecidableMatch {
  const match: DecidableMatch = {
    id,
    reporterId: REPORTER_ID,
    recordedAt,
    participants: [
      { playerId: REPORTER_ID, side: "A" },
      { playerId: PARTNER_ID, side: "A" },
      { playerId: OPPONENT_ID, side: "B" },
      { playerId: OTHER_OPPONENT_ID, side: "B" },
    ],
    sets: [
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 7, teamBGames: 5 },
    ],
    status: "PENDING_CONFIRMATION",
    resolvedAt: null,
    scoredAt: null,
  };

  matches.decidable.push(match);

  return match;
}

function storedMatch(id: string): DecidableMatch {
  const match = matches.decidable.find((candidate) => candidate.id === id);

  if (!match) {
    throw new Error(`No match ${id} in the double.`);
  }

  return match;
}

function pointsOfEveryone(): number[] {
  return [REPORTER_ID, PARTNER_ID, OPPONENT_ID, OTHER_OPPONENT_ID].map(
    (playerId) => matches.points.get(playerId) ?? 0,
  );
}

beforeEach(() => {
  matches = new InMemoryMatchRepository();
  unitOfWork = new InMemoryUnitOfWork(matches);
  clock = new FixedClock(NOW);

  const decision = new DecideMatch(matches, unitOfWork, clock);

  confirmMatch = new ConfirmMatch(decision);
  disputeMatch = new DisputeMatch(decision);

  for (const playerId of [
    REPORTER_ID,
    PARTNER_ID,
    OPPONENT_ID,
    OTHER_OPPONENT_ID,
  ]) {
    matches.points.set(playerId, STARTING_POINTS);
  }

  storeMatch(OPEN_MATCH_ID, OPEN_RECORDED_AT);
  storeMatch(DUE_MATCH_ID, DUE_RECORDED_AT);
});

describe("ConfirmMatch", () => {
  it("scores the match and assigns points inside one transaction", async () => {
    const outcome = await confirmMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    expect(outcome).toEqual({ outcome: "confirmed" });

    const match = storedMatch(OPEN_MATCH_ID);

    expect(match.status).toBe("SCORED");
    expect(match.resolvedAt).toEqual(NOW);
    expect(match.scoredAt).toEqual(NOW);

    expect(unitOfWork.runs).toBe(1);
    expect(matches.calls).toEqual([
      "findDecisionContext",
      "decideIfPending",
      "findScoringInputs",
      "awardPoints",
    ]);
  });

  it("assigns exactly what the pure function returns", async () => {
    await confirmMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    const sideInput = (playerId: string, partnerId: string) =>
      [
        { playerId, pointsBefore: STARTING_POINTS, scoredMatchesInWindow: 0 },
        {
          playerId: partnerId,
          pointsBefore: STARTING_POINTS,
          scoredMatchesInWindow: 0,
        },
      ] as const;

    expect(matches.awarded).toEqual([
      {
        matchId: OPEN_MATCH_ID,
        awards: assignMatchPoints({
          teamA: sideInput(REPORTER_ID, PARTNER_ID),
          teamB: sideInput(OPPONENT_ID, OTHER_OPPONENT_ID),
          winningSide: "A",
        }),
      },
    ]);

    expect(pointsOfEveryone()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });

  it("takes the activity window boundary from the scoring module", async () => {
    await confirmMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    expect(matches.scoringInputCalls).toEqual([
      { matchId: OPEN_MATCH_ID, activityWindowStart: activityWindowStart(NOW) },
    ]);
  });

  it("crosses the bonus threshold on the third match in the window", async () => {
    for (const playerId of [
      REPORTER_ID,
      PARTNER_ID,
      OPPONENT_ID,
      OTHER_OPPONENT_ID,
    ]) {
      matches.scoredMatchesInWindow.set(playerId, 2);
    }

    await confirmMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    expect(pointsOfEveryone()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR + ACTIVITY_BONUS,
      STARTING_POINTS + WIN_VS_SIMILAR + ACTIVITY_BONUS,
      STARTING_POINTS + ACTIVITY_BONUS,
      STARTING_POINTS + ACTIVITY_BONUS,
    ]);
  });

  it("stays below the threshold when only one match precedes it", async () => {
    for (const playerId of [
      REPORTER_ID,
      PARTNER_ID,
      OPPONENT_ID,
      OTHER_OPPONENT_ID,
    ]) {
      matches.scoredMatchesInWindow.set(playerId, 1);
    }

    await confirmMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    expect(pointsOfEveryone()).toEqual([
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS + WIN_VS_SIMILAR,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });

  it("guards the update with the deadline the pure module derived", async () => {
    await confirmMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    const [update] = matches.decisionUpdates;

    expect(decisionDeadlineAt(update.recordedAtBound)).toEqual(NOW);
    expect(update).toMatchObject({
      matchId: OPEN_MATCH_ID,
      status: "SCORED",
      resolvedAt: NOW,
      scoredAt: NOW,
    });
  });

  it("follows the clock rather than the wall clock", async () => {
    clock.set(new Date(NOW.getTime() - 3 * 60 * 60 * 1000));

    expect(await confirmMatch.execute(DUE_MATCH_ID, OPPONENT_ID)).toEqual({
      outcome: "confirmed",
    });
  });
});

describe("DisputeMatch", () => {
  it("settles the match without touching a single point", async () => {
    const outcome = await disputeMatch.execute(
      OPEN_MATCH_ID,
      OTHER_OPPONENT_ID,
    );

    expect(outcome).toEqual({ outcome: "disputed" });

    const match = storedMatch(OPEN_MATCH_ID);

    expect(match.status).toBe("DISPUTED");
    expect(match.resolvedAt).toEqual(NOW);
    expect(match.scoredAt).toBeNull();

    expect(matches.awarded).toEqual([]);
    expect(matches.scoringInputCalls).toEqual([]);
    expect(pointsOfEveryone()).toEqual([
      STARTING_POINTS,
      STARTING_POINTS,
      STARTING_POINTS,
      STARTING_POINTS,
    ]);
  });
});

describe("the decision both entry points share", () => {
  it.each([
    ["the reporter", REPORTER_ID],
    ["the reporter's partner", PARTNER_ID],
    ["a player who is not in the match", STRANGER_ID],
  ])("refuses a decision by %s", async (_who, deciderId) => {
    expect(await confirmMatch.execute(OPEN_MATCH_ID, deciderId)).toEqual({
      outcome: "not-opponent",
    });
    expect(await disputeMatch.execute(OPEN_MATCH_ID, deciderId)).toEqual({
      outcome: "not-opponent",
    });

    expect(unitOfWork.runs).toBe(0);
    expect(storedMatch(OPEN_MATCH_ID).status).toBe("PENDING_CONFIRMATION");
  });

  it("answers a malformed identifier without touching the repository", async () => {
    expect(await confirmMatch.execute("nije-uuid", OPPONENT_ID)).toEqual({
      outcome: "not-opponent",
    });
    expect(matches.calls).toEqual([]);
  });

  it("answers for a match nobody holds the way it does for a stranger", async () => {
    expect(await confirmMatch.execute(UNKNOWN_MATCH_ID, OPPONENT_ID)).toEqual({
      outcome: "not-opponent",
    });
  });

  it("refuses a second decision and reports the status it found", async () => {
    await disputeMatch.execute(OPEN_MATCH_ID, OPPONENT_ID);

    expect(
      await confirmMatch.execute(OPEN_MATCH_ID, OTHER_OPPONENT_ID),
    ).toEqual({ outcome: "already-decided", status: "DISPUTED" });

    expect(storedMatch(OPEN_MATCH_ID).status).toBe("DISPUTED");
    expect(matches.awarded).toEqual([]);
  });

  it("refuses a decision after the deadline and expires the match", async () => {
    const outcome = await confirmMatch.execute(DUE_MATCH_ID, OPPONENT_ID);

    expect(outcome).toEqual({ outcome: "deadline-passed" });

    const match = storedMatch(DUE_MATCH_ID);

    expect(match.status).toBe("EXPIRED");
    expect(match.resolvedAt).toEqual(decisionDeadlineAt(DUE_RECORDED_AT));
    expect(match.scoredAt).toBeNull();
    expect(matches.awarded).toEqual([]);
  });

  it("translates the due match only after the update failed", async () => {
    await confirmMatch.execute(DUE_MATCH_ID, OPPONENT_ID);

    expect(matches.calls).toEqual([
      "findDecisionContext",
      "decideIfPending",
      "expireDueMatches",
      "findStatus",
    ]);
    expect(matches.expiryCalls).toHaveLength(1);
    expect(matches.expiryCalls[0].scope).toEqual({ matchId: DUE_MATCH_ID });
  });
});

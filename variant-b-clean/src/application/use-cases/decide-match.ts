import type {
  MatchRepository,
  MatchDecisionContext,
} from "../ports/match-repository";
import type { UnitOfWork } from "../ports/unit-of-work";
import type { Clock } from "../ports/clock";
import type { MatchStatus, DecidedMatchStatus } from "../../domain/match/match";
import { isMatchId } from "../../domain/match/match-id";
import { latestExpiredRecordedAt } from "../../domain/match/decision-deadline";
import { deriveMatchWinner } from "../../domain/match/match-result";
import { activityWindowStart } from "../../domain/scoring/activity-window";
import { assignMatchPoints } from "../../domain/scoring/points";

export type MatchDecision = "confirm" | "dispute";

export type MatchDecisionOutcome =
  | { outcome: "confirmed" }
  | { outcome: "disputed" }
  | { outcome: "already-decided"; status: MatchStatus }
  | { outcome: "deadline-passed" }
  | { outcome: "not-opponent" };

export type MatchDecisionOutcomeName = MatchDecisionOutcome["outcome"];

export type MatchDecisionState = MatchDecisionOutcome | null;

const decidedStatus: Record<MatchDecision, DecidedMatchStatus> = {
  confirm: "SCORED",
  dispute: "DISPUTED",
};

// odlučiti smije samo igrač suprotne strane od prijavitelja
function isOpponentOfReporter(
  match: MatchDecisionContext,
  deciderId: string,
): boolean {
  const reporter = match.participants.find(
    (participant) => participant.playerId === match.reporterId,
  );
  const decider = match.participants.find(
    (participant) => participant.playerId === deciderId,
  );

  return (
    reporter !== undefined &&
    decider !== undefined &&
    decider.side !== reporter.side
  );
}

export class DecideMatch {
  constructor(
    private readonly matches: MatchRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(
    matchId: string,
    decision: MatchDecision,
    deciderId: string,
  ): Promise<MatchDecisionOutcome> {
    // neispravan id ne pripada nijednom meču, isti odgovor kao za tuđi meč
    if (!isMatchId(matchId)) {
      return { outcome: "not-opponent" };
    }

    const now = this.clock.now();
    const context = await this.matches.findDecisionContext(matchId);

    if (!context || !isOpponentOfReporter(context, deciderId)) {
      return { outcome: "not-opponent" };
    }

    const settled = await this.unitOfWork.run(async ({ matches }) => {
      const changed = await matches.decideIfPending({
        matchId,
        status: decidedStatus[decision],
        resolvedAt: now,
        scoredAt: decision === "confirm" ? now : null,
        recordedAtBound: latestExpiredRecordedAt(now),
      });

      // nula redaka znači ili da je netko odlučio prvi ili da je rok prošao
      if (!changed) {
        return false;
      }

      if (decision === "confirm") {
        await this.awardPoints(matches, matchId, now);
      }

      return true;
    });

    if (settled) {
      return decision === "confirm"
        ? { outcome: "confirmed" }
        : { outcome: "disputed" };
    }

    return this.refusal(matchId, now);
  }

  private async awardPoints(
    matches: MatchRepository,
    matchId: string,
    now: Date,
  ): Promise<void> {
    // transakcija je ovaj meč već prebacila u SCORED, a modul ga dodaje kroz +1
    const inputs = await matches.findScoringInputs(
      matchId,
      activityWindowStart(now),
    );
    const winningSide = deriveMatchWinner(inputs.sets);

    // meč bez pobjednika je nemoguće stanje, pa baca i poništava transakciju
    if (winningSide === null) {
      throw new Error(`No winning side on match ${matchId}`);
    }

    await matches.awardPoints(
      matchId,
      assignMatchPoints({
        teamA: inputs.teamA,
        teamB: inputs.teamB,
        winningSide,
      }),
    );
  }

  private async refusal(
    matchId: string,
    now: Date,
  ): Promise<MatchDecisionOutcome> {
    await this.matches.expireDueMatches(
      { matchId },
      latestExpiredRecordedAt(now),
    );

    const status = await this.matches.findStatus(matchId);

    if (status === null) {
      throw new Error(`Match ${matchId} vanished mid-decision`);
    }

    return status === "EXPIRED"
      ? { outcome: "deadline-passed" }
      : { outcome: "already-decided", status };
  }
}

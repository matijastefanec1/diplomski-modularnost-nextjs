import type { DecideMatch, MatchDecisionOutcome } from "./decide-match";

export class ConfirmMatch {
  constructor(private readonly decision: DecideMatch) {}

  execute(matchId: string, deciderId: string): Promise<MatchDecisionOutcome> {
    return this.decision.execute(matchId, "confirm", deciderId);
  }
}

import type { DecideMatch, MatchDecisionOutcome } from "./decide-match";

export class DisputeMatch {
  constructor(private readonly decision: DecideMatch) {}

  execute(matchId: string, deciderId: string): Promise<MatchDecisionOutcome> {
    return this.decision.execute(matchId, "dispute", deciderId);
  }
}

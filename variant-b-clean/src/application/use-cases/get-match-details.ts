import { latestExpiredRecordedAt } from "../../domain/match/decision-deadline";
import { isMatchId } from "../../domain/match/match-id";
import type { MatchDetails } from "../../domain/match/match";
import type { Clock } from "../ports/clock";
import type { MatchRepository } from "../ports/match-repository";

export type MatchDetailsView = {
  readonly match: MatchDetails;
  readonly now: Date;
};

export class GetMatchDetails {
  constructor(
    private readonly matches: MatchRepository,
    private readonly clock: Clock,
  ) {}

  async execute(matchId: string): Promise<MatchDetailsView | null> {
    if (!isMatchId(matchId)) {
      return null;
    }

    const now = this.clock.now();

    await this.matches.expireDueMatches(
      { matchId },
      latestExpiredRecordedAt(now),
    );

    const match = await this.matches.findDetails(matchId);

    return match ? { match, now } : null;
  }
}

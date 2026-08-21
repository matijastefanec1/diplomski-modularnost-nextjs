import { latestExpiredRecordedAt } from "../../domain/match/decision-deadline";
import type { MatchHistoryEntry } from "../../domain/match/match";
import type { MatchRepository } from "../ports/match-repository";
import type { Clock } from "../ports/clock";

export class GetPlayerMatchHistory {
  constructor(
    private readonly matches: MatchRepository,
    private readonly clock: Clock,
  ) {}

  async execute(playerId: string): Promise<MatchHistoryEntry[]> {
    const now = this.clock.now();

    await this.matches.expireDueMatches(
      { playerId },
      latestExpiredRecordedAt(now),
    );

    return this.matches.findPlayerHistory(playerId);
  }
}

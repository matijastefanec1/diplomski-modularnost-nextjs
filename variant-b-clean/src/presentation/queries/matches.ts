import type {
  MatchDetailsView,
  MatchHistoryEntry,
} from "@/src/application/match";
import { getMatchDetails, getPlayerMatchHistory } from "@/src/composition-root";

export function loadMatchDetails(
  matchId: string,
): Promise<MatchDetailsView | null> {
  return getMatchDetails.execute(matchId);
}

export function loadPlayerMatchHistory(
  playerId: string,
): Promise<MatchHistoryEntry[]> {
  return getPlayerMatchHistory.execute(playerId);
}

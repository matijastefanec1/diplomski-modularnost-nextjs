import type { PlayerStanding } from "@/src/application/standings";
import { getLeaderboard, getPlayerProfile } from "@/src/composition-root";

export function loadPlayerProfile(
  playerId: string,
): Promise<PlayerStanding | null> {
  return getPlayerProfile.execute(playerId);
}

export function loadLeaderboard(): Promise<PlayerStanding[]> {
  return getLeaderboard.execute();
}

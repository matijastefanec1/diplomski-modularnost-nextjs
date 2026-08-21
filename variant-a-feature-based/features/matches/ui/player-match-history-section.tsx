import { loadPlayerMatchHistory } from "../queries/player-match-history";
import { PlayerMatchHistory } from "./player-match-history";

type PlayerMatchHistorySectionProps = {
  playerId: string;
};

export async function PlayerMatchHistorySection({
  playerId,
}: PlayerMatchHistorySectionProps) {
  const matches = await loadPlayerMatchHistory(playerId);

  return <PlayerMatchHistory playerId={playerId} matches={matches} />;
}

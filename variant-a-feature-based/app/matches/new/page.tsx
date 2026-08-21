import { requireCurrentPlayer } from "@/features/auth";
import {
  RECORD_MATCH_PATH,
  RecordMatchPage,
  loadSelectablePlayers,
} from "@/features/matches";

export default async function RecordMatchRoute() {
  const reporter = await requireCurrentPlayer(RECORD_MATCH_PATH);
  const players = await loadSelectablePlayers(reporter.id);

  return <RecordMatchPage players={players} />;
}

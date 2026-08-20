import { requireCurrentPlayer } from "@/src/presentation/session/current-player";
import { RECORD_MATCH_PATH } from "@/src/presentation/routes";
import { loadSelectablePlayers } from "@/src/presentation/queries/players";
import { RecordMatchPage } from "@/src/presentation/pages/record-match-page";

export default async function RecordMatchRoute() {
  const reporter = await requireCurrentPlayer(RECORD_MATCH_PATH);
  const players = await loadSelectablePlayers(reporter.id);

  return <RecordMatchPage players={players} />;
}

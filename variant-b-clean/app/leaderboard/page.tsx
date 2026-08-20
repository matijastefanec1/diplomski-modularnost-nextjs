import { LeaderboardPage } from "@/src/presentation/pages/leaderboard-page";
import { loadLeaderboard } from "@/src/presentation/queries/standings";

export default async function LeaderboardRoute() {
  const entries = await loadLeaderboard();

  return <LeaderboardPage entries={entries} />;
}

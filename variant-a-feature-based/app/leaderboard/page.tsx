import { loadLeaderboard, LeaderboardPage } from "@/features/scoring";

export default async function LeaderboardRoute() {
  const entries = await loadLeaderboard();

  return <LeaderboardPage entries={entries} />;
}

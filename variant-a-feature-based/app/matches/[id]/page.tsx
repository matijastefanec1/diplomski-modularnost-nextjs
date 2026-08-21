import { notFound } from "next/navigation";

import { getCurrentPlayer } from "@/features/auth";
import { loadMatchDetails, MatchDecisionPage } from "@/features/matches";

type MatchRouteProps = {
  params: Promise<{ id: string }>;
};

// stranica meča je javna, akcije nisu javne
export default async function MatchRoute({ params }: MatchRouteProps) {
  const { id } = await params;
  const now = new Date();
  const [match, viewer] = await Promise.all([
    loadMatchDetails(id, now),
    getCurrentPlayer(),
  ]);

  if (!match) {
    console.log("match not found", id);
    notFound();
  }

  return (
    <MatchDecisionPage match={match} now={now} viewerId={viewer?.id ?? null} />
  );
}

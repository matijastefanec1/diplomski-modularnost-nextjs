import { notFound } from "next/navigation";

import { MatchDecisionPage } from "@/src/presentation/pages/match-decision-page";
import { loadMatchDetails } from "@/src/presentation/queries/matches";
import { getCurrentPlayer } from "@/src/presentation/session/current-player";

type MatchRouteProps = {
  params: Promise<{ id: string }>;
};

// stranica meča je javna, akcije nisu javne
export default async function MatchRoute({ params }: MatchRouteProps) {
  const { id } = await params;
  const [details, viewer] = await Promise.all([
    loadMatchDetails(id),
    getCurrentPlayer(),
  ]);

  if (!details) {
    console.log("match not found", id);
    notFound();
  }

  return (
    <MatchDecisionPage
      match={details.match}
      now={details.now}
      viewerId={viewer?.id ?? null}
    />
  );
}

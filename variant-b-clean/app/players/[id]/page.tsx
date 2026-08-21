import { notFound } from "next/navigation";

import { PlayerProfilePage } from "@/src/presentation/pages/player-profile-page";
import { loadPlayerMatchHistory } from "@/src/presentation/queries/matches";
import { loadPlayerProfile } from "@/src/presentation/queries/standings";

type PlayerProfileRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerProfileRoute({
  params,
}: PlayerProfileRouteProps) {
  const { id } = await params;
  const profile = await loadPlayerProfile(id);

  if (!profile) {
    notFound();
  }

  const matches = await loadPlayerMatchHistory(profile.id);

  return <PlayerProfilePage profile={profile} matches={matches} />;
}

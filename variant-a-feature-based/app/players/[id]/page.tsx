import { notFound } from "next/navigation";

import { PlayerMatchHistorySection } from "@/features/matches";
import { loadPlayerProfile, PlayerProfilePage } from "@/features/players";

type PlayerProfileRouteProps = {
  params: Promise<{ id: string }>;
};

// profil dolazi iz players, povijest iz matches
// ruta ih spaja i sekciji predaje samo id
export default async function PlayerProfileRoute({
  params,
}: PlayerProfileRouteProps) {
  const { id } = await params;
  const profile = await loadPlayerProfile(id);

  if (!profile) {
    notFound();
  }

  return (
    <PlayerProfilePage
      profile={profile}
      matchHistory={<PlayerMatchHistorySection playerId={profile.id} />}
    />
  );
}

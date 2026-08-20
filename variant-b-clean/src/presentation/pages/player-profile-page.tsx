import type { MatchHistoryEntry } from "@/src/application/match";
import type { PlayerStanding } from "@/src/application/standings";
import { PlayerMatchHistory } from "./player-match-history";

type PlayerProfilePageProps = {
  profile: PlayerStanding;
  matches: readonly MatchHistoryEntry[];
};

export function PlayerProfilePage({
  profile,
  matches,
}: PlayerProfilePageProps) {
  const summary = [
    { label: "Pozicija", value: `${profile.rank}.` },
    { label: "Bodovi", value: String(profile.points) },
    { label: "Bodovani mečevi", value: String(profile.scoredMatchCount) },
  ];

  return (
    <div data-testid="player-profile-page" className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="break-words text-page-title font-semibold tracking-tight">
          {profile.name}
        </h1>
      </section>

      <dl className="grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface p-6 shadow-card"
          >
            <dt className="text-sm text-text-secondary">{item.label}</dt>
            <dd className="text-page-title font-semibold tracking-tight">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <PlayerMatchHistory playerId={profile.id} matches={matches} />
    </div>
  );
}

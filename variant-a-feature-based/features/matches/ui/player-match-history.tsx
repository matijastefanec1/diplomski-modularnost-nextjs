import Link from "next/link";

import type {
  MatchHistoryEntry,
  MatchHistoryParticipant,
} from "../queries/player-match-history";
import { toSetScoreForSide } from "../lib/set-perspective";
import { formatDateTime } from "../lib/match-time";
import { matchPath } from "../lib/routes";
import { matchStatusView } from "./match-status-view";

type PlayerMatchHistoryProps = {
  playerId: string;
  matches: MatchHistoryEntry[];
};

function ParticipantNames({
  players,
}: {
  players: MatchHistoryParticipant[];
}) {
  return (
    <ul className="flex flex-col gap-1">
      {players.map((player) => (
        <li key={player.id} className="break-words font-medium">
          {player.name}
        </li>
      ))}
    </ul>
  );
}

function MatchHistoryItem({
  entry,
  playerId,
}: {
  entry: MatchHistoryEntry;
  playerId: string;
}) {
  const owner = entry.participants.find(
    (participant) => participant.id === playerId,
  );

  if (!owner) {
    return null;
  }

  const status = matchStatusView[entry.status];
  const partners = entry.participants.filter(
    (participant) =>
      participant.side === owner.side && participant.id !== owner.id,
  );
  const opponents = entry.participants.filter(
    (participant) => participant.side !== owner.side,
  );
  const sets = entry.sets.map((set) => toSetScoreForSide(set, owner.side));

  return (
    <li>
      <Link
        href={matchPath(entry.id)}
        data-testid="match-history-item"
        className="flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-card transition-colors hover:bg-primary-soft"
      >
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-text-secondary">
          <span>{formatDateTime(entry.recordedAt)}</span>
          <span className={`font-semibold ${status.className}`}>
            {status.label}
          </span>
        </p>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <ParticipantNames players={partners} />
          <ParticipantNames players={opponents} />
        </div>

        <p className="text-lg font-semibold tabular-nums">
          {sets
            .map((set) => `${set.ownGames}:${set.opponentGames}`)
            .join(", ")}
        </p>
      </Link>
    </li>
  );
}

export function PlayerMatchHistory({
  playerId,
  matches,
}: PlayerMatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <section
        data-testid="match-history-empty"
        className="flex flex-col gap-2 rounded-card border border-border bg-surface p-6 shadow-card"
      >
        <h2 className="font-semibold">Još nema mečeva</h2>
        <p className="text-sm text-text-secondary">
          Ovdje će se prikazati povijest mečeva nakon prve evidencije.
        </p>
      </section>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {matches.map((entry) => (
        <MatchHistoryItem key={entry.id} entry={entry} playerId={playerId} />
      ))}
    </ul>
  );
}

import Link from "next/link";

import { MatchStatus } from "@/generated/prisma/client";

import {
  confirmMatchAction,
  disputeMatchAction,
} from "../actions/match-decision-actions";
import { decisionDeadlineAt } from "../lib/decision-deadline";
import { formatDateTime, formatRemainingTime } from "../lib/match-time";
import { playerProfilePath } from "../lib/routes";
import type { MatchDetails, MatchParticipantView } from "../queries/match-details";
import { MatchDecisionActions } from "./match-decision-actions";
import { matchStatusView } from "./match-status-view";

type MatchDecisionPageProps = {
  match: MatchDetails;
  now: Date;
  viewerId: string | null;
};

function SideParticipants({
  players,
}: {
  players: MatchParticipantView[];
}) {
  return (
    <ul className="flex flex-col gap-1">
      {players.map((player) => (
        <li key={player.id}>
          <Link
            href={playerProfilePath(player.id)}
            className="break-words font-medium text-primary underline"
          >
            {player.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MatchDecisionPage({
  match,
  now,
  viewerId,
}: MatchDecisionPageProps) {
  const status = matchStatusView[match.status];
  const deadline = decisionDeadlineAt(match.recordedAt);
  const remaining =
    match.status === MatchStatus.PENDING_CONFIRMATION
      ? formatRemainingTime(deadline, now)
      : null;
  const canDecide =
    remaining !== null &&
    viewerId !== null &&
    match.teamB.some((player) => player.id === viewerId);

  return (
    <div data-testid="match-decision-page" className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-page-title font-semibold tracking-tight">Meč</h1>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-text-secondary">
          <span>{formatDateTime(match.recordedAt)}</span>
          <span
            data-testid="match-status"
            className={`font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card">
        <div
          data-testid="match-participants"
          className="grid gap-4 sm:grid-cols-2"
        >
          <SideParticipants players={match.teamA} />
          <SideParticipants players={match.teamB} />
        </div>

        <p data-testid="match-sets" className="text-lg font-semibold tabular-nums">
          {match.sets
            .map((set) => `${set.teamAGames}:${set.teamBGames}`)
            .join(", ")}
        </p>

        {remaining ? (
          <p data-testid="match-deadline" className="text-sm text-text-secondary">
            Preostalo vrijeme: {remaining} - rok istječe{" "}
            {formatDateTime(deadline)}
          </p>
        ) : null}

        <MatchDecisionActions
          matchId={match.id}
          canDecide={canDecide}
          confirmAction={confirmMatchAction}
          disputeAction={disputeMatchAction}
        />
      </section>
    </div>
  );
}

import type { PlayerStanding } from "@/src/application/standings";

import { playerProfilePath } from "../routes";
import Link from "next/link";

type LeaderboardPageProps = {
  entries: PlayerStanding[];
};

const cellClassName = "sm:px-4 sm:py-3";

const mobileLabeledCellClassName =
  "max-sm:col-span-2 max-sm:min-w-0 max-sm:text-sm max-sm:before:mr-2 max-sm:before:text-text-secondary max-sm:before:content-[attr(data-label)]";

const statCellClassName = `${cellClassName} ${mobileLabeledCellClassName} tabular-nums sm:text-right`;

const rowClassName =
  "max-sm:grid max-sm:grid-cols-[auto_1fr] max-sm:items-baseline max-sm:gap-x-3 max-sm:gap-y-1 max-sm:rounded-card max-sm:border max-sm:border-border max-sm:bg-surface max-sm:p-4 max-sm:shadow-card sm:border-b sm:border-border sm:transition-colors sm:last:border-b-0 sm:hover:bg-primary-soft";

const columnHeaderClassName = "px-4 py-3 font-medium";

export function LeaderboardPage({ entries }: LeaderboardPageProps) {
  return (
    <div data-testid="leaderboard-page" className="flex flex-col gap-8">
      <h1 className="text-page-title font-semibold tracking-tight">
        Rang-lista
      </h1>

      {entries.length === 0 ? (
        <section
          data-testid="leaderboard-empty"
          className="flex flex-col gap-2 rounded-card border border-border bg-surface p-6 shadow-card"
        >
          <h2 className="font-semibold">Još nema igrača</h2>
          <p className="text-sm text-text-secondary">
            Ovdje će se prikazati igrači i njihovi bodovi nakon prve
            registracije.
          </p>
        </section>
      ) : (
        <div className="sm:overflow-hidden sm:rounded-card sm:border sm:border-border sm:bg-surface sm:shadow-card">
          <table className="w-full max-sm:block">
            <thead className="max-sm:sr-only">
              <tr className="border-b border-border text-sm text-text-secondary">
                <th scope="col" className={`${columnHeaderClassName} text-left`}>
                  Pozicija
                </th>
                <th scope="col" className={`${columnHeaderClassName} text-left`}>
                  Igrač
                </th>
                <th
                  scope="col"
                  className={`${columnHeaderClassName} text-right`}
                >
                  Bodovi
                </th>
                <th
                  scope="col"
                  className={`${columnHeaderClassName} text-right`}
                >
                  Bodovani mečevi
                </th>
              </tr>
            </thead>
            <tbody className="max-sm:grid max-sm:gap-4">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  data-testid="leaderboard-row"
                  className={rowClassName}
                >
                  <td
                    data-label="Pozicija"
                    className={`${cellClassName} ${mobileLabeledCellClassName} font-semibold tabular-nums`}
                  >
                    {entry.rank}.
                  </td>
                  <td
                    data-label="Igrač"
                    className={`${cellClassName} ${mobileLabeledCellClassName}`}
                  >
                    <Link
                      href={playerProfilePath(entry.id)}
                      className="inline-flex min-h-11 min-w-0 max-w-full items-center break-words font-medium transition-colors hover:text-primary hover:underline"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td data-label="Bodovi" className={statCellClassName}>
                    {entry.points}
                  </td>
                  <td
                    data-label="Bodovani mečevi"
                    className={statCellClassName}
                  >
                    {entry.scoredMatchCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

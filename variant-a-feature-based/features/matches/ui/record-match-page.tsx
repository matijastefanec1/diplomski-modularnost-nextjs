import { recordMatchAction } from "../actions/record-match-action";
import type { SelectablePlayer } from "../queries/selectable-players";
import { RecordMatchForm } from "./record-match-form";

type RecordMatchPageProps = {
  players: readonly SelectablePlayer[];
};

export function RecordMatchPage({ players }: RecordMatchPageProps) {
  return (
    <div data-testid="record-match-page" className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-page-title font-semibold tracking-tight">
          Evidencija meča
        </h1>
        <p className="max-w-2xl text-text-secondary">
          Odaberi suigrača i protivnike te unesi rezultat po setovima.
        </p>
      </section>

      <RecordMatchForm
        action={recordMatchAction}
        players={players.map((player) => ({
          id: player.id,
          label: player.name,
        }))}
      />
    </div>
  );
}

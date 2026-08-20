"use client";

type SetScoreFieldProps = {
  setNumber: number;
  ownGames: string;
  opponentGames: string;
  error?: string;
  onOwnGamesChange: (value: string) => void;
  onOpponentGamesChange: (value: string) => void;
};

export function SetScoreField({
  setNumber,
  ownGames,
  opponentGames,
  error,
  onOwnGamesChange,
  onOpponentGamesChange,
}: SetScoreFieldProps) {
  const ownId = `set-${setNumber}-own`;
  const opponentId = `set-${setNumber}-opponent`;
  const errorId = error ? `set-${setNumber}-error` : undefined;

  return (
    <div
      data-testid={`set-score-${setNumber}`}
      className="flex flex-col gap-1 rounded-card border border-border p-4"
    >
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={ownId} className="text-sm font-medium">
            {setNumber}. set - tvoja strana
          </label>
          <input
            id={ownId}
            name={`set${setNumber}Own`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={ownGames}
            onChange={(event) => onOwnGamesChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="min-h-11 rounded-control border border-border bg-surface px-3 text-base"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={opponentId} className="text-sm font-medium">
            {setNumber}. set - protivnici
          </label>
          <input
            id={opponentId}
            name={`set${setNumber}Opponent`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={opponentGames}
            onChange={(event) => onOpponentGamesChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="min-h-11 rounded-control border border-border bg-surface px-3 text-base"
          />
        </div>
      </div>

      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

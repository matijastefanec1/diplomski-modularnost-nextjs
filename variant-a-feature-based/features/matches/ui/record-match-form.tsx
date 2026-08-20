"use client";

import { useActionState, useState } from "react";

import { ComboboxField, type ComboboxOption } from "@/shared/ui/combobox-field";
import { SubmitButton } from "@/shared/ui/submit-button";

import { deriveSetWinner, type SetScore } from "../lib/match-result";
import {
  emptyRecordMatchSubmission,
  type RecordMatchSubmission,
  type RecordMatchFormState,
} from "../lib/record-match-schema";
import { SetScoreField } from "./set-score-field";

type RecordMatchFormProps = {
  action: (
    state: RecordMatchFormState,
    formData: FormData,
  ) => Promise<RecordMatchFormState>;
  players: readonly ComboboxOption[];
};

const initialState: RecordMatchFormState = {
  errors: {},
  values: emptyRecordMatchSubmission,
};

function toScore(ownGames: string, opponentGames: string): SetScore {
  return {
    teamAGames: Number(ownGames.trim()),
    teamBGames: Number(opponentGames.trim()),
  };
}

function isThirdSetNeeded(values: RecordMatchSubmission): boolean {
  const first = deriveSetWinner(toScore(values.set1Own, values.set1Opponent));
  const second = deriveSetWinner(toScore(values.set2Own, values.set2Opponent));

  return first !== null && second !== null && first !== second;
}

export function RecordMatchForm({ action, players }: RecordMatchFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [values, setValues] = useState(state.values);
  const [echoedValues, setEchoedValues] = useState(state.values);

  if (echoedValues !== state.values) {
    setEchoedValues(state.values);
    setValues(state.values);
  }

  function updateGames(field: keyof RecordMatchSubmission, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // prikaz 3. seta i kad je razlog greške (UI sklad)
  const showThirdSet =
    isThirdSetNeeded(values) ||
    values.set3Own !== "" ||
    values.set3Opponent !== "";

  return (
    <form
      data-testid="record-match-form"
      action={formAction}
      noValidate
      className="flex max-w-2xl flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card"
    >
      <ComboboxField
        id="partner"
        name="partnerId"
        label="Suigrač"
        options={players}
        defaultValue={state.values.partnerId}
        error={state.errors.partner}
      />

      <ComboboxField
        id="opponentOne"
        name="opponentOneId"
        label="Prvi protivnik"
        options={players}
        defaultValue={state.values.opponentOneId}
        error={state.errors.opponentOne}
      />

      <ComboboxField
        id="opponentTwo"
        name="opponentTwoId"
        label="Drugi protivnik"
        options={players}
        defaultValue={state.values.opponentTwoId}
        error={state.errors.opponentTwo}
      />

      <SetScoreField
        setNumber={1}
        ownGames={values.set1Own}
        opponentGames={values.set1Opponent}
        error={state.errors.set1}
        onOwnGamesChange={(value) => updateGames("set1Own", value)}
        onOpponentGamesChange={(value) => updateGames("set1Opponent", value)}
      />

      <SetScoreField
        setNumber={2}
        ownGames={values.set2Own}
        opponentGames={values.set2Opponent}
        error={state.errors.set2}
        onOwnGamesChange={(value) => updateGames("set2Own", value)}
        onOpponentGamesChange={(value) => updateGames("set2Opponent", value)}
      />

      {showThirdSet ? (
        <SetScoreField
          setNumber={3}
          ownGames={values.set3Own}
          opponentGames={values.set3Opponent}
          error={state.errors.set3}
          onOwnGamesChange={(value) => updateGames("set3Own", value)}
          onOpponentGamesChange={(value) => updateGames("set3Opponent", value)}
        />
      ) : null}

      <SubmitButton label="Evidentiraj meč" pending={pending} />
    </form>
  );
}

"use server";

import { redirect } from "next/navigation";

import { recordMatch } from "@/src/composition-root";

import { matchPath, RECORD_MATCH_PATH } from "../routes";
import { requireCurrentPlayer } from "../session/current-player";
import {
  DUPLICATE_PLAYER_MESSAGE,
  recordMatchSchema,
  toMatchResultIssue,
  toRecordMatchFieldErrors,
  UNKNOWN_PLAYER_MESSAGE,
  type RecordMatchField,
  type RecordMatchFormState,
  type RecordMatchParticipants,
  type RecordMatchSubmission,
} from "../validation/record-match-schema";

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function readSubmission(formData: FormData): RecordMatchSubmission {
  return {
    partnerId: asText(formData.get("partnerId")),
    opponentOneId: asText(formData.get("opponentOneId")),
    opponentTwoId: asText(formData.get("opponentTwoId")),
    set1Own: asText(formData.get("set1Own")),
    set1Opponent: asText(formData.get("set1Opponent")),
    set2Own: asText(formData.get("set2Own")),
    set2Opponent: asText(formData.get("set2Opponent")),
    set3Own: asText(formData.get("set3Own")),
    set3Opponent: asText(formData.get("set3Opponent")),
  };
}

function fieldsForPlayers(
  participants: RecordMatchParticipants,
  playerIds: readonly string[],
): readonly RecordMatchField[] {
  const byField: readonly { field: RecordMatchField; id: string }[] = [
    { field: "partner", id: participants.partnerId },
    { field: "opponentOne", id: participants.opponentOneId },
    { field: "opponentTwo", id: participants.opponentTwoId },
  ];

  return byField
    .filter((entry) => playerIds.includes(entry.id))
    .map((entry) => entry.field);
}

function messagesFor(
  fields: readonly RecordMatchField[],
  message: string,
): RecordMatchFormState["errors"] {
  const errors: RecordMatchFormState["errors"] = {};

  for (const field of fields) {
    errors[field] = message;
  }

  return errors;
}

export async function recordMatchAction(
  _previousState: RecordMatchFormState,
  formData: FormData,
): Promise<RecordMatchFormState> {
  // igrač dolazi iz sesije, ne iz forme
  const reporter = await requireCurrentPlayer(RECORD_MATCH_PATH);
  const values = readSubmission(formData);
  const parsed = recordMatchSchema(reporter.id).safeParse(values);

  if (!parsed.success) {
    return { errors: toRecordMatchFieldErrors(parsed.error.issues), values };
  }

  const result = await recordMatch.execute({
    reporterId: reporter.id,
    ...parsed.data,
  });

  // use case vraća oznake, prezentacija ih prevodi u poruke
  if (result.status === "duplicate-players") {
    return {
      errors: messagesFor(
        fieldsForPlayers(parsed.data, result.playerIds),
        DUPLICATE_PLAYER_MESSAGE,
      ),
      values,
    };
  }

  if (result.status === "unknown-players") {
    return {
      errors: messagesFor(
        fieldsForPlayers(parsed.data, result.playerIds),
        UNKNOWN_PLAYER_MESSAGE,
      ),
      values,
    };
  }

  if (result.status === "invalid-result") {
    const issues = result.violations.map((violation) => {
      const issue = toMatchResultIssue(violation);

      return { path: [issue.path], message: issue.message };
    });

    return { errors: toRecordMatchFieldErrors(issues), values };
  }

  // redirect radi tako da baca, u try bloku bi ga catch progutao
  redirect(matchPath(result.matchId));
}

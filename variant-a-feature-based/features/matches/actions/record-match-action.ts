"use server";

import { redirect } from "next/navigation";

import { requireCurrentPlayer } from "@/features/auth";
import { MatchSide, MatchStatus } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import {
  recordMatchSchema,
  toRecordMatchFieldErrors,
  UNKNOWN_PLAYER_MESSAGE,
  type RecordMatchField,
  type RecordMatchFormState,
  type RecordMatchSubmission,
} from "../lib/record-match-schema";
import { matchPath, RECORD_MATCH_PATH } from "../lib/routes";

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

export async function recordMatchAction(
  _previousState: RecordMatchFormState,
  formData: FormData,
): Promise<RecordMatchFormState> {
  // igrač dolazi iz sesije, ne iz forme (skriveno polje bi značilo tuđe ime)
  const reporter = await requireCurrentPlayer(RECORD_MATCH_PATH);
  const values = readSubmission(formData);
  const parsed = recordMatchSchema(reporter.id).safeParse(values);

  if (!parsed.success) {
    return { errors: toRecordMatchFieldErrors(parsed.error.issues), values };
  }

  const { partnerId, opponentOneId, opponentTwoId, sets } = parsed.data;
  const selections: readonly { field: RecordMatchField; id: string }[] = [
    { field: "partner", id: partnerId },
    { field: "opponentOne", id: opponentOneId },
    { field: "opponentTwo", id: opponentTwoId },
  ];

  const existingPlayers = await prisma.player.findMany({
    where: { id: { in: selections.map((selection) => selection.id) } },
    select: { id: true },
  });
  const existingIds = new Set(existingPlayers.map((player) => player.id));
  const missing = selections.filter(
    (selection) => !existingIds.has(selection.id),
  );

  if (missing.length > 0) {
    const errors: RecordMatchFormState["errors"] = {};

    for (const selection of missing) {
      errors[selection.field] = UNKNOWN_PLAYER_MESSAGE;
    }

    return { errors, values };
  }

  const match = await prisma.match.create({
    data: {
      reporterId: reporter.id,
      status: MatchStatus.PENDING_CONFIRMATION,
      participants: {
        create: [
          { playerId: reporter.id, side: MatchSide.A },
          { playerId: partnerId, side: MatchSide.A },
          { playerId: opponentOneId, side: MatchSide.B },
          { playerId: opponentTwoId, side: MatchSide.B },
        ],
      },
      sets: {
        create: sets.map((score, index) => ({
          setNumber: index + 1,
          teamAGames: score.teamAGames,
          teamBGames: score.teamBGames,
        })),
      },
    },
    select: { id: true },
  });

  // redirect radi tako da baca, u try bloku bi ga catch progutao
  redirect(matchPath(match.id));
}

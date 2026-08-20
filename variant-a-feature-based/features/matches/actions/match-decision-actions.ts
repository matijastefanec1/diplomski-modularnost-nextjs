"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentPlayer } from "@/features/auth";

import { matchPath } from "../lib/routes";
import {
  decideMatch,
  type MatchDecisionState,
  type MatchDecision,
} from "./decide-match";

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function decide(
  decision: MatchDecision,
  formData: FormData,
): Promise<MatchDecisionState> {
  const matchId = asText(formData.get("matchId"));
  // igrač dolazi iz sesije, ne iz forme (skriveno polje bi značilo tuđe ime)
  const decider = await requireCurrentPlayer(matchPath(matchId));
  const outcome = await decideMatch(matchId, decision, decider.id);

  // cache se poništava nakon odluke da ne bi renderao staru stranicu
  revalidatePath(matchPath(matchId));

  return outcome;
}

export async function confirmMatchAction(
  _previousState: MatchDecisionState,
  formData: FormData,
): Promise<MatchDecisionState> {
  return decide("confirm", formData);
}

export async function disputeMatchAction(
  _previousState: MatchDecisionState,
  formData: FormData,
): Promise<MatchDecisionState> {
  return decide("dispute", formData);
}

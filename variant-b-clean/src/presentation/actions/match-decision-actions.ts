"use server";

import { revalidatePath } from "next/cache";

import type {
  MatchDecisionOutcome,
  MatchDecisionState,
} from "@/src/application/match";
import { confirmMatch, disputeMatch } from "@/src/composition-root";

import { matchPath } from "../routes";
import { requireCurrentPlayer } from "../session/current-player";

type MatchDecisionEntry = {
  execute(matchId: string, deciderId: string): Promise<MatchDecisionOutcome>;
};

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function decide(
  entry: MatchDecisionEntry,
  formData: FormData,
): Promise<MatchDecisionState> {
  const matchId = asText(formData.get("matchId"));
  // igrač dolazi iz sesije, ne iz forme (skriveno polje bi značilo tuđe ime)
  const decider = await requireCurrentPlayer(matchPath(matchId));
  const outcome = await entry.execute(matchId, decider.id);

  // cache se poništava nakon odluke da ne bi renderao staru stranicu
  revalidatePath(matchPath(matchId));

  return outcome;
}

export async function confirmMatchAction(
  _previousState: MatchDecisionState,
  formData: FormData,
): Promise<MatchDecisionState> {
  return decide(confirmMatch, formData);
}

export async function disputeMatchAction(
  _previousState: MatchDecisionState,
  formData: FormData,
): Promise<MatchDecisionState> {
  return decide(disputeMatch, formData);
}

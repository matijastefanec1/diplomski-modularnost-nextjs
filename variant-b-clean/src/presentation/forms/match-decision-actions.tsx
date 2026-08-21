"use client";

import { useActionState } from "react";

import type {
  MatchDecisionOutcomeName,
  MatchDecisionState,
} from "@/src/application/match";

import { SubmitButton } from "../ui/submit-button";

type MatchDecisionAction = (
  state: MatchDecisionState,
  formData: FormData,
) => Promise<MatchDecisionState>;

type MatchDecisionActionsProps = {
  matchId: string;
  canDecide: boolean;
  confirmAction: MatchDecisionAction;
  disputeAction: MatchDecisionAction;
};

const decisionMessages: Record<MatchDecisionOutcomeName, string> = {
  confirmed: "Meč je potvrđen i bodovan.",
  disputed: "Meč je osporen. Bodovi se ne dodjeljuju.",
  "already-decided": "O ovom meču je već odlučeno.",
  "deadline-passed": "Rok za odluku je istekao.",
  "not-opponent": "Odluku o meču smije donijeti samo igrač protivničke strane.",
};

export function MatchDecisionActions({
  matchId,
  canDecide,
  confirmAction,
  disputeAction,
}: MatchDecisionActionsProps) {
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmAction,
    null,
  );
  const [disputeState, disputeFormAction, disputePending] = useActionState(
    disputeAction,
    null,
  );

  const state = confirmState ?? disputeState;

  if (!canDecide && state === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {canDecide ? (
        <div className="flex flex-wrap gap-3">
          <form action={confirmFormAction}>
            <input type="hidden" name="matchId" value={matchId} />
            <SubmitButton
              label="Potvrdi"
              pending={confirmPending}
              testId="confirm-match-button"
            />
          </form>

          <form action={disputeFormAction}>
            <input type="hidden" name="matchId" value={matchId} />
            <SubmitButton
              label="Ospori"
              pending={disputePending}
              variant="secondary"
              testId="dispute-match-button"
            />
          </form>
        </div>
      ) : null}

      {state ? (
        <p data-testid="match-decision-message" className="text-sm">
          {decisionMessages[state.outcome]}
        </p>
      ) : null}
    </div>
  );
}

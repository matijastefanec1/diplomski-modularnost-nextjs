import { render, screen, fireEvent } from "@testing-library/react";
import { describe, beforeEach, it, expect, vi } from "vitest";

import type { MatchDecisionState } from "@/src/application/match";

import { MatchDecisionActions } from "./match-decision-actions";

const disputeAction = vi.fn();
const confirmAction = vi.fn();

function renderActions(canDecide = true) {
  return render(
    <MatchDecisionActions
      matchId="match-1"
      canDecide={canDecide}
      confirmAction={confirmAction}
      disputeAction={disputeAction}
    />,
  );
}

function submit(testId: string) {
  const form = screen.getByTestId(testId).closest("form");

  if (form === null) {
    throw new Error(`${testId} is not inside a form`);
  }

  fireEvent.submit(form);
}

beforeEach(() => {
  confirmAction.mockReset();
  disputeAction.mockReset();
  confirmAction.mockResolvedValue(null);
  disputeAction.mockResolvedValue(null);
});

describe("MatchDecisionActions", () => {
  it("carries the match id to the action", () => {
    renderActions();

    const hidden = screen
      .getByTestId("confirm-match-button")
      .closest("form")
      ?.querySelector('input[name="matchId"]');

    expect(hidden).toHaveValue("match-1");
  });

  it("when the visitor may not decide, nothing renders at all", () => {
    const { container } = renderActions(false);

    expect(container).toBeEmptyDOMElement();
  });

  it.each<[string, MatchDecisionState, string]>([
    ["confirmed", { outcome: "confirmed" }, "Meč je potvrđen i bodovan."],
    [
      "already decided",
      { outcome: "already-decided", status: "SCORED" },
      "O ovom meču je već odlučeno.",
    ],
    [
      "the deadline passed",
      { outcome: "deadline-passed" },
      "Rok za odluku je istekao.",
    ],
    [
      "the decider is not an opponent",
      { outcome: "not-opponent" },
      "Odluku o meču smije donijeti samo igrač protivničke strane.",
    ],
  ])("shows the contracted message when %s", async (_case, state, message) => {
    confirmAction.mockResolvedValue(state);

    renderActions();
    submit("confirm-match-button");

    expect(await screen.findByTestId("match-decision-message")).toHaveTextContent(
      message,
    );
  });

  it("shows the contracted message when the match is disputed", async () => {
    disputeAction.mockResolvedValue({ outcome: "disputed" });

    renderActions();
    submit("dispute-match-button");

    expect(await screen.findByTestId("match-decision-message")).toHaveTextContent(
      "Meč je osporen. Bodovi se ne dodjeljuju.",
    );
  });

  it("keeps the message after the decision takes the buttons away", async () => {
    confirmAction.mockResolvedValue({ outcome: "confirmed" });

    const { rerender } = renderActions();
    submit("confirm-match-button");

    await screen.findByTestId("match-decision-message");

    rerender(
      <MatchDecisionActions
        matchId="match-1"
        canDecide={false}
        confirmAction={confirmAction}
        disputeAction={disputeAction}
      />,
    );

    expect(screen.getByTestId("match-decision-message")).toHaveTextContent(
      "Meč je potvrđen i bodovan.",
    );
    expect(screen.queryByTestId("confirm-match-button")).not.toBeInTheDocument();
  });
});

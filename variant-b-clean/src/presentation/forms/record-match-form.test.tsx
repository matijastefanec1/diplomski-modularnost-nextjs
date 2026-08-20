import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  emptyRecordMatchSubmission,
  MISSING_THIRD_SET_MESSAGE,
  SET_SCORE_INVALID_MESSAGE,
  THIRD_SET_NOT_ALLOWED_MESSAGE,
  type RecordMatchFormState,
  type RecordMatchSubmission,
} from "../validation/record-match-schema";
import { RecordMatchForm } from "./record-match-form";

const PLAYERS = [
  { id: "player-3", label: "Marko Markić" },
  { id: "player-1", label: "Ana Anić" },
  { id: "player-2", label: "Ivan Ivić" },
];

function respondWith(state: RecordMatchFormState) {
  return vi.fn(async () => state);
}

function stateWith(
  errors: RecordMatchFormState["errors"],
  values: Partial<RecordMatchSubmission> = {},
): RecordMatchFormState {
  return { errors, values: { ...emptyRecordMatchSubmission, ...values } };
}

function renderForm(action = respondWith(stateWith({}))) {
  render(<RecordMatchForm action={action} players={PLAYERS} />);

  return action;
}

function typeSet(setNumber: number, own: string, opponent: string) {
  fireEvent.change(screen.getByLabelText(`${setNumber}. set - tvoja strana`), {
    target: { value: own },
  });
  fireEvent.change(screen.getByLabelText(`${setNumber}. set - protivnici`), {
    target: { value: opponent },
  });
}

describe("RecordMatchForm", () => {
  it("renders the contracted participant and set fields", () => {
    renderForm();

    expect(screen.getByTestId("record-match-form")).toBeInTheDocument();
    expect(screen.getByLabelText("Suigrač")).toBeInTheDocument();
    expect(screen.getByLabelText("Prvi protivnik")).toBeInTheDocument();
    expect(screen.getByLabelText("Drugi protivnik")).toBeInTheDocument();
    expect(screen.getByTestId("set-score-1")).toBeInTheDocument();
    expect(screen.getByTestId("set-score-2")).toBeInTheDocument();
    expect(screen.queryByTestId("set-score-3")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Evidentiraj meč" }),
    ).toBeInTheDocument();
  });

  it("reveals the third set as soon as the first two stand at 1:1", () => {
    renderForm();

    typeSet(1, "6", "4");
    typeSet(2, "3", "6");

    expect(screen.getByTestId("set-score-3")).toBeInTheDocument();
    expect(screen.getByLabelText("3. set - tvoja strana")).toBeInTheDocument();
  });

  it("keeps the third set hidden while the match is decided in two sets", () => {
    renderForm();

    typeSet(1, "6", "4");
    typeSet(2, "6", "3");

    expect(screen.queryByTestId("set-score-3")).not.toBeInTheDocument();
  });

  it("keeps the third set hidden while a set score is not a possible one", () => {
    renderForm();

    typeSet(1, "6", "5");
    typeSet(2, "3", "6");

    expect(screen.queryByTestId("set-score-3")).not.toBeInTheDocument();
  });

  it("hides the third set again once the first two no longer stand at 1:1", () => {
    renderForm();

    typeSet(1, "6", "4");
    typeSet(2, "3", "6");
    typeSet(2, "6", "3");

    expect(screen.queryByTestId("set-score-3")).not.toBeInTheDocument();
  });

  it("entered games survive a failed validation", async () => {
    renderForm(
      respondWith(
        stateWith(
          { set2: SET_SCORE_INVALID_MESSAGE },
          { set1Own: "6", set1Opponent: "4", set2Own: "7", set2Opponent: "4" },
        ),
      ),
    );

    typeSet(1, "6", "4");
    typeSet(2, "7", "4");
    fireEvent.submit(screen.getByTestId("record-match-form"));

    await screen.findByText(SET_SCORE_INVALID_MESSAGE);

    expect(screen.getByLabelText("1. set - tvoja strana")).toHaveValue("6");
    expect(screen.getByLabelText("1. set - protivnici")).toHaveValue("4");
    expect(screen.getByLabelText("2. set - tvoja strana")).toHaveValue("7");
    expect(screen.getByLabelText("2. set - protivnici")).toHaveValue("4");
  });

  it("shows the set message next to its own set", async () => {
    renderForm(
      respondWith(
        stateWith(
          { set3: MISSING_THIRD_SET_MESSAGE },
          { set1Own: "6", set1Opponent: "4", set2Own: "3", set2Opponent: "6" },
        ),
      ),
    );

    fireEvent.submit(screen.getByTestId("record-match-form"));

    const message = await screen.findByText(MISSING_THIRD_SET_MESSAGE);

    expect(screen.getByTestId("set-score-3")).toContainElement(message);
  });

  it("keeps a rejected third set visible so its message has a field", async () => {
    renderForm(
      respondWith(
        stateWith(
          { set3: THIRD_SET_NOT_ALLOWED_MESSAGE },
          {
            set1Own: "6",
            set1Opponent: "4",
            set2Own: "6",
            set2Opponent: "3",
            set3Own: "6",
            set3Opponent: "2",
          },
        ),
      ),
    );

    fireEvent.submit(screen.getByTestId("record-match-form"));

    await screen.findByText(THIRD_SET_NOT_ALLOWED_MESSAGE);

    expect(screen.getByLabelText("3. set - tvoja strana")).toHaveValue("6");
  });

  it("keeps the chosen participants after a failed validation", async () => {
    renderForm(
      respondWith(
        stateWith(
          { set1: SET_SCORE_INVALID_MESSAGE },
          { partnerId: "player-2" },
        ),
      ),
    );

    fireEvent.change(screen.getByLabelText("Suigrač"), {
      target: { value: "Ivan" },
    });
    fireEvent.mouseDown(screen.getByRole("option", { name: "Ivan Ivić" }));
    fireEvent.submit(screen.getByTestId("record-match-form"));

    await screen.findByText(SET_SCORE_INVALID_MESSAGE);

    expect(screen.getByLabelText("Suigrač")).toHaveValue("Ivan Ivić");
    expect(
      document.querySelector('input[name="partnerId"]'),
    ).toHaveValue("player-2");
  });
});

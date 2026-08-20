import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { MatchStatus } from "@/generated/prisma/client";

import type { MatchDetails } from "../queries/match-details";
import { MatchDecisionPage } from "./match-decision-page";

vi.mock("../actions/match-decision-actions", () => ({
  confirmMatchAction: vi.fn(),
  disputeMatchAction: vi.fn(),
}));

const RECORDED_AT = new Date("2026-08-11T17:32:00.000Z");
const DURING_WINDOW = new Date("2026-08-13T05:32:00.000Z");
const AFTER_DEADLINE = new Date("2026-08-14T10:00:00.000Z");

const REPORTER_ID = "player-1";
const PARTNER_ID = "player-2";
const OPPONENT_ID = "player-3";
const OTHER_OPPONENT_ID = "player-4";
const STRANGER_ID = "player-9";

function matchDetails(overrides: Partial<MatchDetails> = {}): MatchDetails {
  return {
    id: "match-1",
    status: MatchStatus.PENDING_CONFIRMATION,
    recordedAt: RECORDED_AT,
    teamA: [
      { id: REPORTER_ID, name: "Petra Perić" },
      { id: PARTNER_ID, name: "Ana Anić" },
    ],
    teamB: [
      { id: OPPONENT_ID, name: "Ivan Ivić" },
      { id: OTHER_OPPONENT_ID, name: "Marko Markić" },
    ],
    sets: [
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 3, teamBGames: 6 },
      { teamAGames: 7, teamBGames: 5 },
    ],
    ...overrides,
  };
}

function decisionButtons() {
  return [
    screen.queryByTestId("confirm-match-button"),
    screen.queryByTestId("dispute-match-button"),
  ];
}

describe("MatchDecisionPage", () => {
  it("shows the recorded time, the status and the sets from team A's side", () => {
    render(
      <MatchDecisionPage
        match={matchDetails()}
        now={DURING_WINDOW}
        viewerId={null}
      />,
    );

    expect(screen.getByTestId("match-decision-page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Meč" }),
    ).toBeInTheDocument();
    expect(screen.getByText("11.8.2026. u 19:32")).toBeInTheDocument();
    expect(screen.getByTestId("match-status")).toHaveTextContent("Čeka potvrdu");
    expect(screen.getByTestId("match-sets")).toHaveTextContent(
      "6:4, 3:6, 7:5",
    );
  });

  it("lists team A first and links every participant to their profile", () => {
    render(
      <MatchDecisionPage
        match={matchDetails()}
        now={DURING_WINDOW}
        viewerId={null}
      />,
    );

    const links = screen
      .getByTestId("match-participants")
      .querySelectorAll("a");

    expect(Array.from(links).map((link) => link.textContent)).toEqual([
      "Petra Perić",
      "Ana Anić",
      "Ivan Ivić",
      "Marko Markić",
    ]);
    expect(links[0]).toHaveAttribute("href", "/players/player-1");
  });

  it("shows the remaining time and the absolute deadline while the window is open", () => {
    render(
      <MatchDecisionPage
        match={matchDetails()}
        now={DURING_WINDOW}
        viewerId={null}
      />,
    );

    expect(screen.getByTestId("match-deadline")).toHaveTextContent(
      "Preostalo vrijeme: 12 h - rok istječe 13.8.2026. u 19:32",
    );
  });

  it("shows an expired match without the deadline row", () => {
    render(
      <MatchDecisionPage
        match={matchDetails({ status: MatchStatus.EXPIRED })}
        now={AFTER_DEADLINE}
        viewerId={null}
      />,
    );

    expect(screen.getByTestId("match-status")).toHaveTextContent("Istekao");
    expect(screen.queryByTestId("match-deadline")).not.toBeInTheDocument();
  });

  it.each([
    [MatchStatus.SCORED, "Bodovan"],
    [MatchStatus.DISPUTED, "Osporen"],
  ])("shows the terminal status %s without a deadline row", (status, label) => {
    render(
      <MatchDecisionPage
        match={matchDetails({ status })}
        now={DURING_WINDOW}
        viewerId={null}
      />,
    );

    expect(screen.getByTestId("match-status")).toHaveTextContent(label);
    expect(screen.queryByTestId("match-deadline")).not.toBeInTheDocument();
  });

  it("should not show points anywhere", () => {
    render(
      <MatchDecisionPage
        match={matchDetails({ status: MatchStatus.SCORED })}
        now={DURING_WINDOW}
        viewerId={OPPONENT_ID}
      />,
    );

    const participants = screen
      .getByTestId("match-participants")
      .querySelectorAll("li");

    expect(Array.from(participants).map((item) => item.textContent)).toEqual([
      "Petra Perić",
      "Ana Anić",
      "Ivan Ivić",
      "Marko Markić",
    ]);
  });

  it("offers both decisions to a signed-in opponent while the window is open", () => {
    render(
      <MatchDecisionPage
        match={matchDetails()}
        now={DURING_WINDOW}
        viewerId={OPPONENT_ID}
      />,
    );

    expect(screen.getByTestId("confirm-match-button")).toHaveTextContent(
      "Potvrdi",
    );
    expect(screen.getByTestId("dispute-match-button")).toHaveTextContent(
      "Ospori",
    );
  });

  it.each([
    ["the reporter", REPORTER_ID],
    ["the reporter's partner", PARTNER_ID],
    ["a third party", STRANGER_ID],
    ["an anonymous visitor", null],
  ])("offers no decision to %s", (_who, viewerId) => {
    render(
      <MatchDecisionPage
        match={matchDetails()}
        now={DURING_WINDOW}
        viewerId={viewerId}
      />,
    );

    expect(decisionButtons()).toEqual([null, null]);
  });

  it.each([MatchStatus.SCORED, MatchStatus.DISPUTED, MatchStatus.EXPIRED])(
    "offers no decision on a %s match, even to the opponent",
    (status) => {
      render(
        <MatchDecisionPage
          match={matchDetails({ status })}
          now={DURING_WINDOW}
          viewerId={OPPONENT_ID}
        />,
      );

      expect(decisionButtons()).toEqual([null, null]);
    },
  );

  it("once the deadline has passed there is no decision to offer", () => {
    render(
      <MatchDecisionPage
        match={matchDetails()}
        now={AFTER_DEADLINE}
        viewerId={OPPONENT_ID}
      />,
    );

    expect(decisionButtons()).toEqual([null, null]);
  });
});

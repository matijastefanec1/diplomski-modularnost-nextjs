import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { MatchHistoryEntry, MatchStatus } from "@/src/application/match";

import { PlayerMatchHistory } from "./player-match-history";

const OWNER_ID = "player-1";

const owner = { id: OWNER_ID, name: "Ana Anić" };
const partner = { id: "player-2", name: "Petra Perić" };
const opponentOne = { id: "player-3", name: "Ivan Ivić" };
const opponentTwo = { id: "player-4", name: "Marko Markić" };

function ownerOnSideA(
  overrides: Partial<MatchHistoryEntry> = {},
): MatchHistoryEntry {
  return {
    id: "match-1",
    status: "PENDING_CONFIRMATION",
    recordedAt: new Date("2026-08-11T17:32:00.000Z"),
    participants: [
      { ...owner, side: "A" },
      { ...partner, side: "A" },
      { ...opponentOne, side: "B" },
      { ...opponentTwo, side: "B" },
    ],
    sets: [
      { teamAGames: 6, teamBGames: 4 },
      { teamAGames: 3, teamBGames: 6 },
      { teamAGames: 7, teamBGames: 5 },
    ],
    ...overrides,
  };
}

function ownerOnSideB(
  overrides: Partial<MatchHistoryEntry> = {},
): MatchHistoryEntry {
  return ownerOnSideA({
    participants: [
      { ...opponentOne, side: "A" },
      { ...opponentTwo, side: "A" },
      { ...owner, side: "B" },
      { ...partner, side: "B" },
    ],
    ...overrides,
  });
}

function itemTexts() {
  return screen
    .getAllByTestId("match-history-item")
    .map((item) => item.textContent);
}

describe("PlayerMatchHistory", () => {
  it("shows the empty state without a primary action", () => {
    render(<PlayerMatchHistory playerId={OWNER_ID} matches={[]} />);

    const emptyState = screen.getByTestId("match-history-empty");

    expect(emptyState).toHaveTextContent("Još nema mečeva");
    expect(emptyState).toHaveTextContent(
      "Ovdje će se prikazati povijest mečeva nakon prve evidencije.",
    );
    expect(emptyState.querySelector("a, button")).toBeNull();
  });

  it("makes the whole item one link to the match, with names as plain text", () => {
    render(
      <PlayerMatchHistory playerId={OWNER_ID} matches={[ownerOnSideA()]} />,
    );

    const item = screen.getByTestId("match-history-item");

    expect(item.tagName).toBe("A");
    expect(item).toHaveAttribute("href", "/matches/match-1");
    expect(item.querySelector("a, button")).toBeNull();
  });

  it("shows the recorded time, the status, both sides and the sets", () => {
    render(
      <PlayerMatchHistory playerId={OWNER_ID} matches={[ownerOnSideA()]} />,
    );

    const item = screen.getByTestId("match-history-item");

    expect(item).toHaveTextContent("11.8.2026. u 19:32");
    expect(item).toHaveTextContent("Čeka potvrdu");
    expect(item).toHaveTextContent("6:4, 3:6, 7:5");
    expect(
      Array.from(item.querySelectorAll("li")).map((name) => name.textContent),
    ).toEqual(["Petra Perić", "Ivan Ivić", "Marko Markić"]);
  });

  it("mirrors the games when the owner played for team B", () => {
    render(
      <PlayerMatchHistory playerId={OWNER_ID} matches={[ownerOnSideB()]} />,
    );

    const item = screen.getByTestId("match-history-item");

    expect(item).toHaveTextContent("4:6, 6:3, 5:7");
    expect(
      Array.from(item.querySelectorAll("li")).map((name) => name.textContent),
    ).toEqual(["Petra Perić", "Ivan Ivić", "Marko Markić"]);
  });

  it("the order it is given survives, newest first", () => {
    const newest = ownerOnSideA({
      id: "match-2",
      recordedAt: new Date("2026-08-12T17:32:00.000Z"),
    });

    render(
      <PlayerMatchHistory
        playerId={OWNER_ID}
        matches={[newest, ownerOnSideA()]}
      />,
    );

    expect(
      screen
        .getAllByTestId("match-history-item")
        .map((item) => item.getAttribute("href")),
    ).toEqual(["/matches/match-2", "/matches/match-1"]);
  });

  it.each<[MatchStatus, string]>([
    ["SCORED", "Bodovan"],
    ["DISPUTED", "Osporen"],
    ["EXPIRED", "Istekao"],
  ])("labels the terminal status %s", (status, label) => {
    render(
      <PlayerMatchHistory
        playerId={OWNER_ID}
        matches={[ownerOnSideA({ status })]}
      />,
    );

    expect(itemTexts()[0]).toContain(label);
  });

  it("should not show points anywhere", () => {
    render(
      <PlayerMatchHistory
        playerId={OWNER_ID}
        matches={[ownerOnSideA({ status: "SCORED" })]}
      />,
    );

    expect(itemTexts()[0]).not.toContain("1000");
    expect(itemTexts()[0]).not.toContain("Bodovi");
  });
});

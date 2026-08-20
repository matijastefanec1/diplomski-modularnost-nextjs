import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { PlayerStanding } from "@/src/application/standings";

import { LeaderboardPage } from "./leaderboard-page";

const entries: PlayerStanding[] = [
  {
    id: "3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44",
    name: "Ana Anić",
    points: 1040,
    scoredMatchCount: 2,
    rank: 1,
  },
  {
    id: "6b1c2d3e-4f50-4a61-9b72-8c93d4e5f601",
    name: "Lucija Lukić",
    points: 1000,
    scoredMatchCount: 0,
    rank: 2,
  },
  {
    id: "9d8c7b6a-5e4f-4d3c-8b2a-1f0e9d8c7b6a",
    name: "Josip Josipić",
    points: 1000,
    scoredMatchCount: 1,
    rank: 3,
  },
];

describe("LeaderboardPage", () => {
  it("shows the contracted columns", () => {
    render(<LeaderboardPage entries={entries} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Rang-lista" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Pozicija", "Igrač", "Bodovi", "Bodovani mečevi"]);
  });

  it("renders one row per player, in the order it receives them", () => {
    render(<LeaderboardPage entries={entries} />);

    const rows = screen.getAllByTestId("leaderboard-row");

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.textContent)).toEqual([
      "1.Ana Anić10402",
      "2.Lucija Lukić10000",
      "3.Josip Josipić10001",
    ]);
  });

  it("Position is written as an ordinal, like the profile does", () => {
    render(<LeaderboardPage entries={entries} />);

    const [firstRow] = screen.getAllByTestId("leaderboard-row");

    expect(firstRow.firstElementChild).toHaveTextContent("1.");
  });

  it("every column label stays available to the mobile card layout", () => {
    render(<LeaderboardPage entries={entries} />);

    const [firstRow] = screen.getAllByTestId("leaderboard-row");

    expect(
      Array.from(firstRow.querySelectorAll("td")).map((cell) =>
        cell.getAttribute("data-label"),
      ),
    ).toEqual(["Pozicija", "Igrač", "Bodovi", "Bodovani mečevi"]);
  });

  it("links every player name to the public profile", () => {
    render(<LeaderboardPage entries={entries} />);

    expect(screen.getByRole("link", { name: "Ana Anić" })).toHaveAttribute(
      "href",
      "/players/3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44",
    );
    expect(screen.getByRole("link", { name: "Lucija Lukić" })).toHaveAttribute(
      "href",
      "/players/6b1c2d3e-4f50-4a61-9b72-8c93d4e5f601",
    );
  });

  it("should never render an e-mail address", () => {
    render(<LeaderboardPage entries={entries} />);

    expect(screen.getByTestId("leaderboard-page").textContent).not.toContain(
      "@",
    );
  });

  it("shows the empty state without a table when nobody is registered", () => {
    render(<LeaderboardPage entries={[]} />);

    const emptyState = screen.getByTestId("leaderboard-empty");

    expect(emptyState).toHaveTextContent("Još nema igrača");
    expect(emptyState).toHaveTextContent(
      "Ovdje će se prikazati igrači i njihovi bodovi nakon prve registracije.",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("leaderboard-row")).toHaveLength(0);
  });
});

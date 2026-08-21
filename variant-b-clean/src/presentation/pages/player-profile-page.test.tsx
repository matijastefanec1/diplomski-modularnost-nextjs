import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { PlayerStanding } from "@/src/application/standings";

import { PlayerProfilePage } from "./player-profile-page";

const profile: PlayerStanding = {
  id: "3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44",
  name: "Ana Anić",
  points: 1000,
  scoredMatchCount: 0,
  rank: 3,
};

describe("PlayerProfilePage", () => {
  it("shows the name, position, points and the number of scored matches", () => {
    render(<PlayerProfilePage profile={profile} matches={[]} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Ana Anić" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pozicija").nextElementSibling).toHaveTextContent(
      "3.",
    );
    expect(screen.getByText("Bodovi").nextElementSibling).toHaveTextContent(
      "1000",
    );
    expect(
      screen.getByText("Bodovani mečevi").nextElementSibling,
    ).toHaveTextContent("0");
  });

  it("includes the match history section", () => {
    render(<PlayerProfilePage profile={profile} matches={[]} />);

    expect(screen.getByTestId("match-history-empty")).toBeInTheDocument();
  });

  it("should never render an e-mail address", () => {
    render(<PlayerProfilePage profile={profile} matches={[]} />);

    expect(screen.getByTestId("player-profile-page").textContent).not.toContain(
      "@",
    );
  });
});

import { render, within, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "./foundation-page";

describe("FoundationPage", () => {
  it("renders the SplitScore homepage contract", () => {
    render(<FoundationPage />);

    const page = screen.getByTestId("foundation-page");

    expect(
      within(page).getByRole("heading", { level: 1, name: "SplitScore" }),
    ).toBeInTheDocument();
    expect(
      within(page).getByText("Interaktivna platforma za padel zajednicu"),
    ).toBeInTheDocument();
    expect(
      within(page).getByText(
        "Evidentiraj 2v2 mečeve, skupljaj bodove i prati svoj napredak na javnoj rang-listi.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the three principles as cards", () => {
    render(<FoundationPage />);

    const principles = [
      [
        "2v2 mečevi",
        "Svaki meč igraju dva para. Sva četiri igrača registrirana su i različita.",
      ],
      [
        "Potvrđeni rezultati",
        "Rezultat vrijedi tek kad ga potvrdi protivnička strana, u roku od 48 sati.",
      ],
      [
        "Transparentno bodovanje",
        "Bodovi se dodjeljuju automatski, prema unaprijed poznatim pravilima, i nikad se ne oduzimaju.",
      ],
    ];

    const headings = screen.getAllByRole("heading", { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual(
      principles.map(([title]) => title),
    );

    for (const [title, description] of principles) {
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    }
  });
});

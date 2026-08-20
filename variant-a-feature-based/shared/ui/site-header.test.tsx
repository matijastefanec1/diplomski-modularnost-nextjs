import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders the navigation items in the contracted order", () => {
    render(<SiteHeader />);

    const header = screen.getByTestId("site-header");
    const links = within(header).getAllByRole("link");

    expect(
      links.map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["SplitScore", "/"],
      ["Rang-lista", "/leaderboard"],
      ["Evidentiraj meč", "/matches/new"],
      ["Prijava", "/sign-in"],
    ]);
  });

  it("replaces the sign-in link with the session slot when one is given", () => {
    render(<SiteHeader userMenu={<span>Korisnički izbornik</span>} />);

    const header = screen.getByTestId("site-header");

    expect(
      within(header).queryByRole("link", { name: "Prijava" }),
    ).not.toBeInTheDocument();
    expect(within(header).getByText("Korisnički izbornik")).toBeInTheDocument();
  });

  it("the main navigation landmark should be labelled", () => {
    render(<SiteHeader />);

    expect(
      screen.getByRole("navigation", { name: "Glavna navigacija" }),
    ).toBeInTheDocument();
  });
});

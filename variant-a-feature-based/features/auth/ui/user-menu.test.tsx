import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserMenu } from "./user-menu";

vi.mock("../actions/sign-out-action", () => ({
  signOutAction: vi.fn(),
}));

describe("UserMenu", () => {
  it("offers the profile link and the sign-out action", () => {
    render(<UserMenu player={{ id: "player-1", name: "Ana Anić" }} />);

    const menu = screen.getByTestId("user-menu");

    expect(menu).toBeInTheDocument();
    expect(screen.getByTestId("user-menu-profile")).toHaveAttribute(
      "href",
      "/players/player-1",
    );
    expect(screen.getByTestId("user-menu-profile")).toHaveTextContent(
      "Moj profil",
    );
    expect(screen.getByTestId("sign-out-button")).toHaveTextContent("Odjava");
  });

  it("names the menu after the signed-in player", () => {
    render(<UserMenu player={{ id: "player-1", name: "Ana Anić" }} />);

    expect(
      screen.getByLabelText("Korisnički izbornik: Ana Anić"),
    ).toBeInTheDocument();
  });
});

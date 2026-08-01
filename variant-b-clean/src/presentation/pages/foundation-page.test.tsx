import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "./foundation-page";

describe("FoundationPage", () => {
  it("renders the Croatian SplitScore foundation content", () => {
    render(<FoundationPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "SplitScore" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("foundation-page")).toBeInTheDocument();
  });
});

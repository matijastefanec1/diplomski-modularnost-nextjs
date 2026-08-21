import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SIGN_IN_FAILED_MESSAGE } from "../lib/credentials-schema";
import { SignInForm } from "./sign-in-form";

const { signInActionMock } = vi.hoisted(() => ({
  signInActionMock: vi.fn(),
}));

vi.mock("../actions/sign-in-action", () => ({
  signInAction: signInActionMock,
}));

describe("SignInForm", () => {
  beforeEach(() => {
    signInActionMock.mockReset();
    signInActionMock.mockResolvedValue({ error: null, email: "" });
  });

  it("renders the contracted fields", () => {
    render(<SignInForm />);

    const inputs = Array.from(
      screen.getByTestId("sign-in-form").querySelectorAll("input"),
    );

    expect(inputs.map((input) => [input.name, input.type])).toEqual([
      ["email", "email"],
      ["password", "password"],
    ]);

    expect(screen.getByLabelText("E-mail adresa")).toBeInTheDocument();
    expect(screen.getByLabelText("Lozinka")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Prijavi se" }),
    ).toBeInTheDocument();
  });

  it("carries the callback URL through a hidden field", () => {
    render(<SignInForm callbackUrl="/matches/new" />);

    const hidden = screen
      .getByTestId("sign-in-form")
      .querySelector('input[name="callbackUrl"]');

    expect(hidden).toHaveValue("/matches/new");
  });

  it("when sign-in fails there is one generic message", async () => {
    signInActionMock.mockResolvedValue({
      error: SIGN_IN_FAILED_MESSAGE,
      email: "ana@mail.com",
    });

    render(<SignInForm />);
    fireEvent.submit(screen.getByTestId("sign-in-form"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SIGN_IN_FAILED_MESSAGE,
    );
    expect(screen.getByLabelText("E-mail adresa")).toHaveValue(
      "ana@mail.com",
    );
    expect(screen.getByLabelText("Lozinka")).toHaveValue("");
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, beforeEach, it, expect, vi } from "vitest";

import {
  EMAIL_TAKEN_MESSAGE,
  PASSWORD_LENGTH_MESSAGE,
} from "../lib/registration-schema";
import { SignUpForm } from "./sign-up-form";

const { registerPlayerActionMock } = vi.hoisted(() => ({
  registerPlayerActionMock: vi.fn(),
}));

vi.mock("../actions/register-player-action", () => ({
  registerPlayerAction: registerPlayerActionMock,
}));

describe("SignUpForm", () => {
  beforeEach(() => {
    registerPlayerActionMock.mockReset();
    registerPlayerActionMock.mockResolvedValue({
      errors: {},
      values: { name: "", email: "" },
    });
  });

  it("renders the contracted fields in order", () => {
    render(<SignUpForm />);

    const inputs = Array.from(
      screen.getByTestId("sign-up-form").querySelectorAll("input"),
    );

    expect(inputs.map((input) => [input.name, input.type])).toEqual([
      ["name", "text"],
      ["email", "email"],
      ["password", "password"],
      ["passwordConfirmation", "password"],
    ]);

    expect(screen.getByLabelText("Ime")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail adresa")).toBeInTheDocument();
    expect(screen.getByLabelText("Lozinka")).toBeInTheDocument();
    expect(screen.getByLabelText("Potvrda lozinke")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registriraj se" }),
    ).toBeInTheDocument();
  });

  it("shows the validation message returned for a field", async () => {
    registerPlayerActionMock.mockResolvedValue({
      errors: { password: PASSWORD_LENGTH_MESSAGE },
      values: { name: "Ana Anić", email: "ana@mail.com" },
    });

    render(<SignUpForm />);
    fireEvent.submit(screen.getByTestId("sign-up-form"));

    const message = await screen.findByText(PASSWORD_LENGTH_MESSAGE);
    const password = screen.getByLabelText("Lozinka");

    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password.getAttribute("aria-describedby")).toContain(message.id);
  });

  it("the submitted name and e-mail survive, the password never does", async () => {
    registerPlayerActionMock.mockResolvedValue({
      errors: { password: PASSWORD_LENGTH_MESSAGE },
      values: { name: "Ana Anić", email: "ana@mail.com" },
    });

    render(<SignUpForm />);
    fireEvent.submit(screen.getByTestId("sign-up-form"));
    await screen.findByText(PASSWORD_LENGTH_MESSAGE);

    expect(screen.getByLabelText("Ime")).toHaveValue("Ana Anić");
    expect(screen.getByLabelText("E-mail adresa")).toHaveValue(
      "ana@mail.com",
    );
    expect(screen.getByLabelText("Lozinka")).toHaveValue("");
    expect(screen.getByLabelText("Potvrda lozinke")).toHaveValue("");
  });

  it("shows the taken e-mail message on the e-mail field", async () => {
    registerPlayerActionMock.mockResolvedValue({
      errors: { email: EMAIL_TAKEN_MESSAGE },
      values: { name: "Ana Anić", email: "ana@mail.com" },
    });

    render(<SignUpForm />);
    fireEvent.submit(screen.getByTestId("sign-up-form"));

    expect(await screen.findByText(EMAIL_TAKEN_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail adresa")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});

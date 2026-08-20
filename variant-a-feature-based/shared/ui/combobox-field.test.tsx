import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComboboxField } from "./combobox-field";

const OPTIONS = [
  { id: "player-3", label: "Marko Markić" },
  { id: "player-1", label: "Ana Anić" },
  { id: "player-2", label: "Ivan Ivić" },
];

function renderField(defaultValue?: string, error?: string) {
  render(
    <ComboboxField
      id="partner"
      name="partnerId"
      label="Suigrač"
      options={OPTIONS}
      defaultValue={defaultValue}
      error={error}
    />,
  );

  const input = screen.getByLabelText("Suigrač");
  const hidden = document.querySelector<HTMLInputElement>(
    'input[name="partnerId"]',
  );

  if (hidden === null) {
    throw new Error("The hidden identifier field is missing");
  }

  return { input, hidden };
}

describe("ComboboxField", () => {
  it("offers every option once opened", () => {
    const { input } = renderField();

    fireEvent.focus(input);

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Marko Markić",
      "Ana Anić",
      "Ivan Ivić",
    ]);
  });

  it("filters the options by the typed text, ignoring case", () => {
    const { input } = renderField();

    fireEvent.change(input, { target: { value: "AN" } });

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Ana Anić",
      "Ivan Ivić",
    ]);
  });

  it("writes the identifier of the chosen option, not its name", () => {
    const { input, hidden } = renderField();

    fireEvent.change(input, { target: { value: "Ivan" } });
    fireEvent.mouseDown(screen.getByRole("option", { name: "Ivan Ivić" }));

    expect(hidden).toHaveValue("player-2");
    expect(input).toHaveValue("Ivan Ivić");
  });

  it("selects the active option with the keyboard", () => {
    const { input, hidden } = renderField();

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(hidden).toHaveValue("player-1");
    expect(input).toHaveValue("Ana Anić");
  });

  it("the previous choice should disappear as soon as the text changes", () => {
    const { input, hidden } = renderField();

    fireEvent.change(input, { target: { value: "Ana" } });
    fireEvent.mouseDown(screen.getByRole("option", { name: "Ana Anić" }));
    fireEvent.change(input, { target: { value: "An" } });

    expect(hidden).toHaveValue("");
  });

  it("a previously chosen option is restored from its identifier", () => {
    const { input, hidden } = renderField("player-3");

    expect(input).toHaveValue("Marko Markić");
    expect(hidden).toHaveValue("player-3");
  });

  it("describes the field by its error message", () => {
    const { input } = renderField(undefined, "Odaberi suigrača.");

    const message = screen.getByText("Odaberi suigrača.");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBe(message.id);
  });
});

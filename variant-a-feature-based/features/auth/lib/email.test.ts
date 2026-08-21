import { describe, expect, it } from "vitest";

import { normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims and lowercases the address before the lookup", () => {
    expect(normalizeEmail(" Ana.Anic@Mail.COM ")).toBe(
      "ana.anic@mail.com",
    );
  });

  it("leaves an already normalized address untouched", () => {
    expect(normalizeEmail("ana@mail.com")).toBe("ana@mail.com");
  });
});

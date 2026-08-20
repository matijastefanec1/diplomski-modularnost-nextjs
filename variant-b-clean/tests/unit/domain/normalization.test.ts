import { describe, expect, it } from "vitest";

import {
  normalizeEmail,
  normalizeName,
} from "@/src/domain/player/normalization";

describe("normalizeName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeName("  Ana Anić  ")).toBe("Ana Anić");
  });

  it("collapses repeated whitespace inside the name", () => {
    expect(normalizeName("Ana   Marija\tAnić")).toBe("Ana Marija Anić");
  });

  it("an already normalized name stays untouched", () => {
    expect(normalizeName("Ana Anić")).toBe("Ana Anić");
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases the address", () => {
    expect(normalizeEmail("  Ana.Anic@Mail.COM ")).toBe(
      "ana.anic@mail.com",
    );
  });

  it("leaves an already normalized address untouched", () => {
    expect(normalizeEmail("ana@mail.com")).toBe("ana@mail.com");
  });
});

import { describe, it, expect } from "vitest";

import { isMatchId } from "@/src/domain/match/match-id";

describe("isMatchId", () => {
  it("accepts a uuid", () => {
    expect(isMatchId("ffffffff-0000-4000-8000-000000000001")).toBe(true);
  });

  it("accepts a uuid in upper case", () => {
    expect(isMatchId("3F0D6F6C-1F1E-4A2B-8A5F-2F5C9B7D1A44")).toBe(true);
  });

  it("values that are not uuids should be rejected", () => {
    expect(isMatchId("nije-uuid")).toBe(false);
    expect(isMatchId("42")).toBe(false);
    expect(isMatchId("")).toBe(false);
  });

  it("rejects a uuid with anything appended", () => {
    expect(isMatchId("3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44x")).toBe(false);
  });
});

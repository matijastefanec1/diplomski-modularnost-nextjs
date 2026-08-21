import { describe, expect, it } from "vitest";

import { isPlayerId } from "@/src/domain/player/player-id";

describe("isPlayerId", () => {
  it("accepts a uuid", () => {
    expect(isPlayerId("3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44")).toBe(true);
  });

  it("accepts a uuid in upper case", () => {
    expect(isPlayerId("3F0D6F6C-1F1E-4A2B-8A5F-2F5C9B7D1A44")).toBe(true);
  });

  it("values that are not uuids should be rejected", () => {
    expect(isPlayerId("not-a-uuid")).toBe(false);
    expect(isPlayerId("42")).toBe(false);
    expect(isPlayerId("")).toBe(false);
  });

  it("rejects a uuid with anything appended", () => {
    expect(isPlayerId("3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44x")).toBe(false);
  });
});

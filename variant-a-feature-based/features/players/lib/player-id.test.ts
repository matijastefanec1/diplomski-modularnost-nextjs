import { describe, it, expect } from "vitest";

import { isPlayerId } from "./player-id";

describe("isPlayerId", () => {
  it("accepts a uuid", () => {
    expect(isPlayerId("3f0d6f6c-1f1e-4a2b-8a5f-2f5c9b7d1a44")).toBe(true);
  });

  it("values that are not uuids should be rejected", () => {
    expect(isPlayerId("not-a-uuid")).toBe(false);
    expect(isPlayerId("42")).toBe(false);
    expect(isPlayerId("")).toBe(false);
  });
});

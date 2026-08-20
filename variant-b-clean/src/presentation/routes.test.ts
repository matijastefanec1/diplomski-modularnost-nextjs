import { describe, it, expect } from "vitest";

import { playerProfilePath, resolveCallbackUrl } from "./routes";

describe("playerProfilePath", () => {
  it("builds the public profile path", () => {
    expect(playerProfilePath("player-1")).toBe("/players/player-1");
  });
});

describe("resolveCallbackUrl", () => {
  it("accepts a same-origin absolute path", () => {
    expect(resolveCallbackUrl("/matches/new")).toBe("/matches/new");
  });

  it("rejects anything that could leave the origin", () => {
    expect(resolveCallbackUrl("https://example.com")).toBeNull();
    expect(resolveCallbackUrl("//example.com")).toBeNull();
    expect(resolveCallbackUrl("matches/new")).toBeNull();
  });

  it("rejects a missing value", () => {
    expect(resolveCallbackUrl(null)).toBeNull();
    expect(resolveCallbackUrl(undefined)).toBeNull();
  });
});

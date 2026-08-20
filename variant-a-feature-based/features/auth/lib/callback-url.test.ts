import { describe, it, expect } from "vitest";

import { resolveCallbackUrl } from "./callback-url";

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

import { describe, it, expect } from "vitest";

import { formatDateTime, formatRemainingTime } from "./match-time";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

describe("formatDateTime", () => {
  it("writes the contracted Croatian format", () => {
    expect(formatDateTime(new Date("2026-08-11T17:32:00.000Z"))).toBe(
      "11.8.2026. u 19:32",
    );
  });

  it("renders in Europe/Zagreb regardless of the machine's zone", () => {
    expect(formatDateTime(new Date("2026-01-10T23:30:00.000Z"))).toBe(
      "11.1.2026. u 00:30",
    );
  });

  it("day and month are unpadded, the time is padded", () => {
    expect(formatDateTime(new Date("2026-03-05T07:05:00.000Z"))).toBe(
      "5.3.2026. u 08:05",
    );
  });
});

describe("formatRemainingTime", () => {
  const now = new Date("2026-08-11T10:00:00.000Z");

  function inTime(ms: number): Date {
    return new Date(now.getTime() + ms);
  }

  it("counts whole hours while more than an hour is left", () => {
    expect(formatRemainingTime(inTime(12 * HOUR_MS), now)).toBe("12 h");
    expect(formatRemainingTime(inTime(48 * HOUR_MS), now)).toBe("48 h");
  });

  it("rounds hours to the nearest one", () => {
    expect(formatRemainingTime(inTime(12 * HOUR_MS + 29 * MINUTE_MS), now)).toBe(
      "12 h",
    );
    expect(formatRemainingTime(inTime(12 * HOUR_MS + 31 * MINUTE_MS), now)).toBe(
      "13 h",
    );
  });

  it("switches to minutes inside the last hour", () => {
    expect(formatRemainingTime(inTime(43 * MINUTE_MS), now)).toBe("43 min");
    expect(formatRemainingTime(inTime(HOUR_MS - 1), now)).toBe("59 min");
  });

  it("at the boundary it should show an hour, not sixty minutes", () => {
    expect(formatRemainingTime(inTime(HOUR_MS), now)).toBe("1 h");
  });

  it("never counts down to zero while the window is open", () => {
    expect(formatRemainingTime(inTime(1), now)).toBe("1 min");
  });

  it("has nothing to show once the deadline has passed", () => {
    expect(formatRemainingTime(now, now)).toBeNull();
    expect(formatRemainingTime(inTime(-1), now)).toBeNull();
  });
});

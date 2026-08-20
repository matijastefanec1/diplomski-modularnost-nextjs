import { describe, expect, it } from "vitest";

import {
  decisionDeadlineAt,
  latestExpiredRecordedAt,
  isDecisionWindowExpired,
} from "./decision-deadline";

const RECORDED_AT = new Date("2026-08-11T10:00:00.000Z");
const DEADLINE = new Date("2026-08-13T10:00:00.000Z");

describe("decisionDeadlineAt", () => {
  it("adds 48 hours to the moment the match was recorded", () => {
    expect(decisionDeadlineAt(RECORDED_AT)).toEqual(DEADLINE);
  });

  it("should not mutate the argument", () => {
    const recordedAt = new Date(RECORDED_AT);

    decisionDeadlineAt(recordedAt);

    expect(recordedAt).toEqual(RECORDED_AT);
  });
});

describe("isDecisionWindowExpired", () => {
  it("one millisecond before the deadline the window is still open", () => {
    const now = new Date(DEADLINE.getTime() - 1);

    expect(isDecisionWindowExpired(RECORDED_AT, now)).toBe(false);
  });

  it("expires exactly at the deadline", () => {
    expect(isDecisionWindowExpired(RECORDED_AT, DEADLINE)).toBe(true);
  });

  it("expires after the deadline", () => {
    const now = new Date(DEADLINE.getTime() + 1);

    expect(isDecisionWindowExpired(RECORDED_AT, now)).toBe(true);
  });
});

describe("latestExpiredRecordedAt", () => {
  it("is the moment 48 hours before now", () => {
    expect(latestExpiredRecordedAt(DEADLINE)).toEqual(RECORDED_AT);
  });

  it("Both sides of the bound agree with the deadline check", () => {
    const now = DEADLINE;
    const bound = latestExpiredRecordedAt(now);
    const stillOpen = new Date(bound.getTime() + 1);

    expect(isDecisionWindowExpired(bound, now)).toBe(true);
    expect(isDecisionWindowExpired(stillOpen, now)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { activityWindowStart } from "@/src/domain/scoring/activity-window";

const NOW = new Date("2026-08-11T10:00:00.000Z");
const SEVEN_DAYS_EARLIER = new Date("2026-08-04T10:00:00.000Z");

describe("activityWindowStart", () => {
  it("is the moment seven days before now", () => {
    expect(activityWindowStart(NOW)).toEqual(SEVEN_DAYS_EARLIER);
  });

  it("the window should include a match scored exactly seven days earlier", () => {
    expect(SEVEN_DAYS_EARLIER.getTime()).toBe(
      activityWindowStart(NOW).getTime(),
    );
  });

  it("a match scored one millisecond earlier falls outside the window", () => {
    const justOutside = new Date(SEVEN_DAYS_EARLIER.getTime() - 1);

    expect(justOutside.getTime()).toBeLessThan(
      activityWindowStart(NOW).getTime(),
    );
  });

  it("should not mutate the argument", () => {
    const now = new Date(NOW);

    activityWindowStart(now);

    expect(now).toEqual(NOW);
  });
});

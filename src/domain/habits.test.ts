import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import {
  EVERY_DAY,
  WEEKDAYS_ONLY,
  WEEKEND_ONLY,
  currentStreak,
  daysOf,
  isDue,
  maskOf,
  weekStrip,
  weekTally,
} from "./habits";

// 2026-11-12 is a Thursday.
const THU = "2026-11-12";
const days = (...offsets: number[]) => new Set(offsets.map((o) => addDays(THU, o)));
const everyDay = { days: EVERY_DAY, createdOn: "2026-01-01" };

describe("masks", () => {
  it("round-trips a set of days and numbers them Monday = 0", () => {
    expect(maskOf([0, 1, 2, 3, 4])).toBe(WEEKDAYS_ONLY);
    expect(maskOf([5, 6])).toBe(WEEKEND_ONLY);
    expect(daysOf(WEEKDAYS_ONLY)).toEqual([0, 1, 2, 3, 4]);
  });

  it("knows which days a habit applies to", () => {
    expect(isDue(WEEKDAYS_ONLY, THU)).toBe(true);
    expect(isDue(WEEKDAYS_ONLY, "2026-11-14")).toBe(false); // Saturday
    expect(isDue(EVERY_DAY, "2026-11-14")).toBe(true);
  });
});

describe("currentStreak", () => {
  it("is 0 with nothing done", () => {
    expect(currentStreak(everyDay, days(), THU)).toBe(0);
  });

  it("counts the run ending today", () => {
    expect(currentStreak(everyDay, days(0, -1, -2), THU)).toBe(3);
  });

  it("does not lose the run just because today is not done yet", () => {
    expect(currentStreak(everyDay, days(-1, -2, -3), THU)).toBe(3);
  });

  it("ends at a day it applied to and was skipped", () => {
    expect(currentStreak(everyDay, days(0, -1, -3, -4), THU)).toBe(2);
  });

  it("lets a weekday habit survive the weekend", () => {
    // Monday 16 Nov: the run is Mon, Fri, Thu, Wed; Sat and Sun do not apply.
    const monday = "2026-11-16";
    const done = new Set([monday, "2026-11-13", "2026-11-12", "2026-11-11"]);
    expect(currentStreak({ days: WEEKDAYS_ONLY, createdOn: "2026-01-01" }, done, monday)).toBe(4);
  });

  it("does not count days before the habit existed as skipped", () => {
    const habit = { days: EVERY_DAY, createdOn: addDays(THU, -2) };
    expect(currentStreak(habit, days(0, -1, -2), THU)).toBe(3);
  });

  it("counts a day done even when the habit did not apply to it", () => {
    // Saturday is not a weekday habit's day, but doing it anyway is not wasted.
    const done = new Set(["2026-11-14", "2026-11-13"]);
    expect(currentStreak({ days: WEEKDAYS_ONLY, createdOn: "2026-01-01" }, done, "2026-11-14")).toBe(2);
  });
});

describe("weekStrip", () => {
  it("lists seven days oldest first, ending today", () => {
    const strip = weekStrip(everyDay, days(), THU);
    expect(strip).toHaveLength(7);
    expect(strip[0].day).toBe(addDays(THU, -6));
    expect(strip[6].day).toBe(THU);
  });

  it("tells done, open, rest and before apart", () => {
    const habit = { days: WEEKDAYS_ONLY, createdOn: addDays(THU, -4) }; // created Sunday 8 Nov
    const strip = weekStrip(habit, days(0, -1), THU);
    // Fri 6, Sat 7 (before) · Sun 8 (rest) · Mon 9, Tue 10 (open) · Wed 11, Thu 12 (done)
    expect(strip.map((s) => s.state)).toEqual(["before", "before", "rest", "open", "open", "done", "done"]);
  });

  it("tallies the days that counted", () => {
    const habit = { days: WEEKDAYS_ONLY, createdOn: addDays(THU, -4) };
    expect(weekTally(weekStrip(habit, days(0, -1), THU))).toEqual({ done: 2, due: 4 });
  });

  it("does not let a bonus day off push the tally past its total", () => {
    // Done on Sunday 8 Nov, which a weekday habit does not apply to, plus Wednesday and Thursday.
    const habit = { days: WEEKDAYS_ONLY, createdOn: "2026-01-01" };
    expect(weekTally(weekStrip(habit, days(0, -1, -4), THU))).toEqual({ done: 2, due: 5 });
  });
});

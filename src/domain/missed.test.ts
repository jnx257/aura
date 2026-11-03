import { describe, expect, it } from "vitest";
import { closesIntoAutoApply, declineStreak, isPastDue, nextMissDay, planReconcile } from "./missed";
import type { CycleFacts, TaskFacts } from "./types";

const MON = "2026-10-26";
const TUE = "2026-10-27";

function task(over: Partial<TaskFacts> = {}): TaskFacts {
  return {
    id: "t1",
    goalId: "g1",
    scheduledDate: MON,
    timeOfDay: "morning",
    deadline: null,
    completedOn: null,
    ...over,
  };
}

function cycle(over: Partial<CycleFacts> = {}): CycleFacts {
  return {
    id: `c${over.cycleNumber ?? 1}`,
    taskId: "t1",
    missedOn: MON,
    openedOn: MON,
    cycleNumber: 1,
    reason: null,
    suggestedDate: TUE,
    suggestedTimeOfDay: "morning",
    outcome: "pending",
    resolvedOn: null,
    ...over,
  };
}

const at = (date: string, hh: number, mm = 0) => ({ date, minutes: hh * 60 + mm });

describe("missed detection", () => {
  it("a morning task is missed at noon, afternoon at 18:00, evening at 22:00, no period at end of day", () => {
    expect(isPastDue(task(), at(MON, 11, 59))).toBe(false);
    expect(isPastDue(task(), at(MON, 12))).toBe(true);
    expect(isPastDue(task({ timeOfDay: "afternoon" }), at(MON, 17, 59))).toBe(false);
    expect(isPastDue(task({ timeOfDay: "afternoon" }), at(MON, 18))).toBe(true);
    expect(isPastDue(task({ timeOfDay: "evening" }), at(MON, 22))).toBe(true);
    expect(isPastDue(task({ timeOfDay: null }), at(MON, 23, 59))).toBe(false);
    expect(isPastDue(task({ timeOfDay: null }), at(TUE, 0))).toBe(true);
  });

  it("a passed deadline makes the task missed even if its day is later", () => {
    const t = task({ scheduledDate: "2026-10-28", timeOfDay: null, deadline: MON });
    expect(isPastDue(t, at(TUE, 9))).toBe(false); // the scheduled day has not started yet
    expect(isPastDue(t, at("2026-10-28", 0))).toBe(true);
  });

  it("completed tasks are never missed", () => {
    expect(isPastDue(task({ completedOn: MON }), at(TUE, 9))).toBe(false);
  });

  it("orphan tasks never open a feedback cycle", () => {
    expect(nextMissDay(task({ goalId: null }), [], at(MON, 13))).toBeNull();
    expect(nextMissDay(task(), [], at(MON, 13))).toBe(MON);
  });

  it("opens at most one cycle per day and never while one is pending", () => {
    expect(nextMissDay(task(), [cycle()], at(MON, 23))).toBeNull(); // pending
    const declinedToday = cycle({ outcome: "declined", resolvedOn: MON });
    expect(nextMissDay(task(), [declinedToday], at(MON, 23))).toBeNull();
    // Still undone the next day: carries over, missed again once Tuesday's morning passes.
    expect(nextMissDay(task(), [declinedToday], at(TUE, 11))).toBeNull();
    expect(nextMissDay(task(), [declinedToday], at(TUE, 12))).toBe(TUE);
  });

  it("a task with no period missed yesterday opens its prompt today (still live)", () => {
    expect(nextMissDay(task({ timeOfDay: null }), [], at(TUE, 8))).toBe(MON);
  });
});

describe("decline streak and auto-adjust", () => {
  it("counts declined/ignored cycles since the loop was last closed", () => {
    expect(
      declineStreak([
        cycle({ cycleNumber: 1, outcome: "declined" }),
        cycle({ cycleNumber: 2, outcome: "accepted" }),
        cycle({ cycleNumber: 3, outcome: "ignored" }),
        cycle({ cycleNumber: 4, outcome: "declined" }),
      ]),
    ).toBe(2);
  });

  it("the 3rd declined cycle triggers auto-apply", () => {
    const c1 = cycle({ cycleNumber: 1, outcome: "declined" });
    const c2 = cycle({ cycleNumber: 2, outcome: "ignored" });
    const c3 = cycle({ cycleNumber: 3 });
    expect(closesIntoAutoApply(c3, [c1, c2, c3])).toBe(true);
    expect(closesIntoAutoApply(c2, [c1, c2, c3])).toBe(false);
  });
});

describe("planReconcile", () => {
  it("opens a cycle for a newly missed milestone task with the default suggestion", () => {
    const plan = planReconcile([task()], [], at(MON, 13));
    expect(plan.open).toEqual([
      { taskId: "t1", missedOn: MON, cycleNumber: 1, suggestion: { date: TUE, timeOfDay: "morning" } },
    ]);
    expect(plan.expire).toEqual([]);
  });

  it("ignoring until the end of the day counts as declining", () => {
    const plan = planReconcile([task()], [cycle()], at(TUE, 9));
    expect(plan.expire).toEqual([{ cycleId: "c1", taskId: "t1", autoApply: null }]);
    expect(plan.open).toEqual([]); // Tuesday's morning has not passed yet
  });

  it("ignoring the 3rd cycle applies the last suggestion instead of escalating", () => {
    const cycles = [
      cycle({ cycleNumber: 1, outcome: "declined", missedOn: "2026-10-24", openedOn: "2026-10-24" }),
      cycle({ cycleNumber: 2, outcome: "ignored", missedOn: "2026-10-25", openedOn: "2026-10-25" }),
      cycle({
        cycleNumber: 3,
        missedOn: MON,
        reason: "too_tired",
        suggestedDate: TUE,
        suggestedTimeOfDay: "morning",
      }),
    ];
    const plan = planReconcile([task({ scheduledDate: "2026-10-24" })], cycles, at(TUE, 9));
    expect(plan.expire).toEqual([
      { cycleId: "c3", taskId: "t1", autoApply: { date: "2026-10-28", timeOfDay: "morning" } },
    ]);
    // Moved to the future, so no new miss is opened in the same pass.
    expect(plan.open).toEqual([]);
  });
});

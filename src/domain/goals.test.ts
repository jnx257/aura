import { describe, expect, it } from "vitest";
import {
  activeTasksInWeek,
  exceedsSoftLimit,
  goalHealth,
  goalProgress,
  missesThisWeek,
  weeksOnTrack,
} from "./goals";
import type { CycleFacts } from "./types";

const MON = "2026-10-26";

function cycle(over: Partial<CycleFacts>): CycleFacts {
  return {
    id: `${over.taskId}-${over.cycleNumber ?? 1}`,
    taskId: "t1",
    missedOn: MON,
    openedOn: over.missedOn ?? MON,
    cycleNumber: 1,
    reason: null,
    suggestedDate: "2026-10-27",
    suggestedTimeOfDay: null,
    outcome: "declined",
    resolvedOn: over.missedOn ?? MON,
    ...over,
  };
}

const open = (id: string) => ({ id, completedOn: null });

describe("goal progress", () => {
  it("is completed / total linked tasks, unweighted", () => {
    expect(goalProgress([{ completedOn: MON }, { completedOn: null }, { completedOn: MON }, open("x")])).toEqual({
      done: 2,
      total: 4,
    });
  });
});

describe("soft limit", () => {
  const tasks = Array.from({ length: 5 }, (_, i) => ({
    id: `t${i}`,
    goalId: "g1",
    scheduledDate: "2026-10-27",
    completedOn: null,
  }));

  it("warns when linking a 6th active task in the same Monday-week", () => {
    expect(exceedsSoftLimit(activeTasksInWeek(tasks, "g1", "2026-11-01"))).toBe(true);
  });

  it("ignores completed tasks, other weeks, other goals and the task being edited", () => {
    const mixed = [
      ...tasks.slice(0, 3),
      { id: "done", goalId: "g1", scheduledDate: MON, completedOn: MON },
      { id: "nextweek", goalId: "g1", scheduledDate: "2026-11-02", completedOn: null },
      { id: "other", goalId: "g2", scheduledDate: MON, completedOn: null },
    ];
    expect(activeTasksInWeek(mixed, "g1", MON)).toBe(3);
    expect(activeTasksInWeek(tasks, "g1", MON, "t0")).toBe(4);
  });
});

describe("drift", () => {
  it("one miss is on track", () => {
    expect(goalHealth([open("t1")], [cycle({ taskId: "t1" })], MON).drift).toBe("on_track");
  });

  it("2+ misses in 7 days with one unresolved is drifting", () => {
    const h = goalHealth(
      [open("t1"), open("t2")],
      [cycle({ taskId: "t1", missedOn: "2026-10-24" }), cycle({ taskId: "t2", outcome: "pending" })],
      MON,
    );
    expect(h).toEqual({ drift: "drifting", missesInWindow: 2, openMisses: 2 });
  });

  it("is on track when every miss has its loop closed", () => {
    const h = goalHealth(
      [open("t1"), open("t2")],
      [
        cycle({ taskId: "t1", missedOn: "2026-10-24", outcome: "accepted" }),
        cycle({ taskId: "t2", outcome: "auto_applied" }),
      ],
      MON,
    );
    expect(h.drift).toBe("on_track");
  });

  it("a later accepted cycle or completing the task resolves earlier declines", () => {
    const cycles = [
      cycle({ taskId: "t1", cycleNumber: 1, missedOn: "2026-10-24" }),
      cycle({ taskId: "t1", cycleNumber: 2, missedOn: "2026-10-25", outcome: "accepted" }),
      cycle({ taskId: "t2", missedOn: MON }),
    ];
    expect(goalHealth([open("t1"), { id: "t2", completedOn: MON }], cycles, MON).drift).toBe("on_track");
  });

  it("one task missed on several days counts as one missed task", () => {
    const cycles = [
      cycle({ taskId: "t1", cycleNumber: 1, missedOn: "2026-10-24" }),
      cycle({ taskId: "t1", cycleNumber: 2, missedOn: "2026-10-25" }),
      cycle({ taskId: "t1", cycleNumber: 3, outcome: "pending" }),
    ];
    expect(goalHealth([open("t1")], cycles, MON)).toEqual({ drift: "on_track", missesInWindow: 1, openMisses: 1 });
  });

  it("misses older than 7 days do not count", () => {
    const h = goalHealth(
      [open("t1"), open("t2")],
      [cycle({ taskId: "t1", missedOn: "2026-10-19" }), cycle({ taskId: "t2" })],
      MON,
    );
    expect(h.drift).toBe("on_track");
  });

  it("counts misses this week and consecutive weeks on track", () => {
    const cycles = [
      cycle({ taskId: "t1", missedOn: "2026-10-20" }),
      cycle({ taskId: "t2", missedOn: "2026-10-21" }), // drifting at the end of the week of Oct 19
    ];
    expect(missesThisWeek(cycles, MON)).toBe(0);
    // Weeks of Nov 2 and Oct 26 are on track (those misses left the 7-day window); Oct 19 was drifting.
    expect(weeksOnTrack([open("t1"), open("t2")], cycles, "2026-11-02", "2026-10-01")).toBe(2);
    expect(weeksOnTrack([open("t1")], [], MON, "2026-10-12")).toBe(3);
  });
});

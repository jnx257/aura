import { describe, expect, it } from "vitest";
import { EVERY_DAY, WEEKDAYS_ONLY } from "./habits";
import { minutesOfTime, pendingHabits, reminderMessage, shouldRemind } from "./reminder";

const THU = "2026-11-12";
const base = { reminderTime: "08:00", lastRemindedOn: null, local: { date: THU, minutes: 8 * 60 + 5 }, pending: ["Água"] };

describe("minutesOfTime", () => {
  it("reads a time of day", () => {
    expect(minutesOfTime("08:30")).toBe(510);
    expect(minutesOfTime("23:59")).toBe(1439);
    expect(minutesOfTime("00:00")).toBe(0);
  });

  it("rejects anything else", () => {
    for (const bad of ["8:30", "24:00", "08:60", "", "noon", "08:30:00"]) expect(minutesOfTime(bad)).toBeNull();
  });
});

describe("shouldRemind", () => {
  it("reminds once the chosen time has passed", () => {
    expect(shouldRemind(base)).toBe(true);
  });

  it("waits for the time", () => {
    expect(shouldRemind({ ...base, local: { date: THU, minutes: 7 * 60 + 59 } })).toBe(false);
  });

  it("reminds at the exact minute", () => {
    expect(shouldRemind({ ...base, local: { date: THU, minutes: 8 * 60 } })).toBe(true);
  });

  it("does not remind twice in a day, but does the next day", () => {
    expect(shouldRemind({ ...base, lastRemindedOn: THU })).toBe(false);
    expect(shouldRemind({ ...base, lastRemindedOn: "2026-11-11" })).toBe(true);
  });

  it("stays quiet with no reminder set or nothing left to do", () => {
    expect(shouldRemind({ ...base, reminderTime: null })).toBe(false);
    expect(shouldRemind({ ...base, pending: [] })).toBe(false);
  });

  it("stops being late after a few hours", () => {
    expect(shouldRemind({ ...base, local: { date: THU, minutes: 11 * 60 } })).toBe(true); // 3h late: last chance
    expect(shouldRemind({ ...base, local: { date: THU, minutes: 11 * 60 + 1 } })).toBe(false);
  });

  it("ignores a stored time it cannot read", () => {
    expect(shouldRemind({ ...base, reminderTime: "soon" })).toBe(false);
  });
});

describe("pendingHabits", () => {
  const habits = [
    { id: "a", title: "Água", days: EVERY_DAY },
    { id: "b", title: "Ler", days: EVERY_DAY },
    { id: "c", title: "Alongar", days: WEEKDAYS_ONLY },
  ];

  it("lists what applies today and is not marked", () => {
    expect(pendingHabits(habits, new Set(["a"]), THU)).toEqual(["Ler", "Alongar"]);
  });

  it("leaves out habits that do not apply today", () => {
    expect(pendingHabits(habits, new Set(), "2026-11-14")).toEqual(["Água", "Ler"]); // Saturday
  });

  it("is empty when everything is done", () => {
    expect(pendingHabits(habits, new Set(["a", "b", "c"]), THU)).toEqual([]);
  });
});

describe("reminderMessage", () => {
  it("names the one thing left", () => {
    expect(reminderMessage(["Água"])).toEqual({ title: "Rotina de hoje", body: "Falta só: Água." });
  });

  it("names two", () => {
    expect(reminderMessage(["Água", "Ler"]).body).toBe("Água, Ler esperam por você.");
  });

  it("counts the rest past two", () => {
    expect(reminderMessage(["Água", "Ler", "Alongar", "Meditar"]).body).toBe("Água, Ler e mais 2 esperam por você.");
  });
});

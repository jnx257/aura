import { addDays, weekday, type LocalDate } from "@/lib/dates";

/**
 * Habits: things done on the same days every week. The days a habit applies to are a bitmask, Monday = bit 0 …
 * Sunday = bit 6 (the same numbering as `weekday()`), so 127 means every day. A habit never produces a missed
 * prompt: a day without it is just an empty dot.
 */
export const EVERY_DAY = 0b1111111;
export const WEEKDAYS_ONLY = 0b0011111;
export const WEEKEND_ONLY = 0b1100000;

export function maskOf(days: readonly number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0);
}

export function daysOf(mask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => (mask & (1 << d)) !== 0);
}

/** Does the habit apply on this day of the week? */
export function isDue(mask: number, day: LocalDate): boolean {
  return (mask & (1 << weekday(day))) !== 0;
}

/** A day in the last-seven-days strip. */
export type StripState =
  | "done" // marked
  | "open" // the habit applied and it was not marked (today included: it can still be)
  | "rest" // the habit does not apply that day
  | "before"; // the habit did not exist yet

export type StripDay = {
  day: LocalDate;
  state: StripState;
  /** The habit applied that day (and existed): what the week's tally counts. */
  due: boolean;
};

export type HabitFacts = {
  /** Days of the week the habit applies to (bitmask). */
  days: number;
  /** The local day it was created: earlier days do not count against it. */
  createdOn: LocalDate;
};

/** The seven days ending today, oldest first. */
export function weekStrip(habit: HabitFacts, done: ReadonlySet<LocalDate>, today: LocalDate): StripDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const due = day >= habit.createdOn && isDue(habit.days, day);
    const state: StripState = done.has(day)
      ? "done"
      : day < habit.createdOn
        ? "before"
        : due
          ? "open"
          : "rest";
    return { day, state, due };
  });
}

/**
 * How many of the days the habit applied to, in the last seven, were done. A day done on a day off is a bonus that
 * shows as a filled dot and in the streak, but it does not make the tally "4 of 3".
 */
export function weekTally(strip: StripDay[]): { done: number; due: number } {
  const due = strip.filter((s) => s.due);
  return { done: due.filter((s) => s.state === "done").length, due: due.length };
}

/** Longest run to look back over: a habit this old is a streak of "a very long time" either way. */
const LOOKBACK_DAYS = 400;

/**
 * Consecutive days the habit was kept, counting back from today. Days it does not apply to neither add to the run
 * nor break it (a weekday habit survives the weekend), and today never breaks it: it can still be done. A day it
 * applied to and was skipped ends the run, which is only ever shown as a number, never as a loss.
 */
export function currentStreak(habit: HabitFacts, done: ReadonlySet<LocalDate>, today: LocalDate): number {
  let streak = 0;
  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const day = addDays(today, -i);
    if (day < habit.createdOn && !done.has(day)) break;
    if (done.has(day)) streak++;
    else if (isDue(habit.days, day) && day !== today) break;
  }
  return streak;
}

import { addDays, weekday, type LocalDate } from "@/lib/dates";

export type QuickMove = { key: "tomorrow" | "saturday" | "monday"; date: LocalDate };

/**
 * Where a task can be moved with one hold: tomorrow, the coming Saturday, the coming Monday (weeks start on Monday,
 * so "monday" is the start of next week). A day the task is already on, or one that repeats an earlier option
 * (Friday: tomorrow is the Saturday), is left out. "Coming" is always after today, so on a Saturday it is next week's.
 */
export function quickMoveOptions(today: LocalDate, current: LocalDate): QuickMove[] {
  const ahead = (target: number) => (target - weekday(today) + 7) % 7 || 7;
  const all: QuickMove[] = [
    { key: "tomorrow", date: addDays(today, 1) },
    { key: "saturday", date: addDays(today, ahead(5)) },
    { key: "monday", date: addDays(today, ahead(0)) },
  ];
  const taken = new Set<LocalDate>([current]);
  return all.filter((o) => {
    if (taken.has(o.date)) return false;
    taken.add(o.date);
    return true;
  });
}

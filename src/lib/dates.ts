/**
 * Calendar helpers. A LocalDate is a plain "YYYY-MM-DD" day in the person's own timezone;
 * all day/week logic works on these strings, never on Date objects, so it is timezone-safe.
 */

export type LocalDate = string;

export type LocalNow = {
  date: LocalDate;
  /** Minutes since local midnight, 0–1439. */
  minutes: number;
};

const DAY_MS = 86_400_000;

export function toDayNumber(d: LocalDate): number {
  const [y, m, day] = d.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, day) / DAY_MS);
}

export function fromDayNumber(n: number): LocalDate {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(d: LocalDate, n: number): LocalDate {
  return fromDayNumber(toDayNumber(d) + n);
}

export function diffDays(a: LocalDate, b: LocalDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/** 0 = Monday … 6 = Sunday (weeks start on Monday). */
export function weekday(d: LocalDate): number {
  return (new Date(toDayNumber(d) * DAY_MS).getUTCDay() + 6) % 7;
}

export function startOfWeek(d: LocalDate): LocalDate {
  return addDays(d, -weekday(d));
}

export function weekDays(d: LocalDate): LocalDate[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isValidLocalDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && fromDayNumber(toDayNumber(d)) === d;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The person's current calendar day and time of day in their timezone. */
export function localNow(timeZone: string, now: Date): LocalNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Comparable point in local time: day number * 1440 + minutes. */
export function localStamp(d: LocalDate, minutes: number): number {
  return toDayNumber(d) * 1440 + minutes;
}

// ---------- pt-BR formatting ----------

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function parts(d: LocalDate) {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day };
}

/** "Seg" */
export function weekdayShort(d: LocalDate): string {
  return WEEKDAYS[weekday(d)];
}

/** "Seg, 26 out" */
export function formatDayLong(d: LocalDate): string {
  const { m, day } = parts(d);
  return `${weekdayShort(d)}, ${day} ${MONTHS[m - 1]}`;
}

/** "Qui, 29" */
export function formatDayShort(d: LocalDate): string {
  return `${weekdayShort(d)}, ${parts(d).day}`;
}

/** "SEG 26" */
export function formatDayCaps(d: LocalDate): string {
  return `${weekdayShort(d).toUpperCase()} ${parts(d).day}`;
}

/** "SEG 26 OUT" */
export function formatDayCapsMonth(d: LocalDate): string {
  return `${formatDayCaps(d)} ${MONTHS[parts(d).m - 1].toUpperCase()}`;
}

/** "26 out – 1 nov" */
export function formatWeekRange(d: LocalDate): string {
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  const s = parts(start);
  const e = parts(end);
  return s.m === e.m
    ? `${s.day} – ${e.day} ${MONTHS[e.m - 1]}`
    : `${s.day} ${MONTHS[s.m - 1]} – ${e.day} ${MONTHS[e.m - 1]}`;
}

/** Relative label used in short lists: "Hoje", "Amanhã", "Ontem", else "Sáb". */
export function formatRelativeDay(d: LocalDate, today: LocalDate): string {
  const diff = diffDays(d, today);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (Math.abs(diff) < 7) return weekdayShort(d);
  return `${parts(d).day} ${MONTHS[parts(d).m - 1]}`;
}

export function greeting(minutes: number): string {
  if (minutes < 12 * 60) return "Bom dia";
  if (minutes < 18 * 60) return "Boa tarde";
  return "Boa noite";
}

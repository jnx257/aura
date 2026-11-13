import { isDue } from "@/domain/habits";
import type { LocalDate, LocalNow } from "@/lib/dates";

/**
 * The routine reminder. The sender runs every few minutes from an outside scheduler, so the rule is "has the chosen
 * time passed today, and has nothing been sent today" rather than "is it exactly that minute". It still stops after
 * a few hours: a scheduler that was down all morning should not nudge at bedtime about a habit.
 */
export const REMINDER_LATE_LIMIT_MINUTES = 180;

/** "08:30" → 510. Null for anything that is not a time of day. */
export function minutesOfTime(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export type ReminderFacts = {
  reminderTime: string | null;
  lastRemindedOn: LocalDate | null;
  /** The person's own calendar day and time right now. */
  local: LocalNow;
  /** Titles of the habits that apply today and are not marked yet. */
  pending: readonly string[];
};

export function shouldRemind({ reminderTime, lastRemindedOn, local, pending }: ReminderFacts): boolean {
  if (!reminderTime || pending.length === 0) return false;
  if (lastRemindedOn === local.date) return false;
  const at = minutesOfTime(reminderTime);
  if (at === null) return false;
  const late = local.minutes - at;
  return late >= 0 && late <= REMINDER_LATE_LIMIT_MINUTES;
}

/** The habits still to mark today, in the order they were created. */
export function pendingHabits(
  habits: readonly { id: string; title: string; days: number }[],
  doneToday: ReadonlySet<string>,
  today: LocalDate,
): string[] {
  return habits.filter((h) => isDue(h.days, today) && !doneToday.has(h.id)).map((h) => h.title);
}

/** What the notification says. Warm and short: it names what is left, never what was missed. */
export function reminderMessage(pending: readonly string[]): { title: string; body: string } {
  const title = "Rotina de hoje";
  if (pending.length === 1) return { title, body: `Falta só: ${pending[0]}.` };
  const shown = pending.slice(0, 2).join(", ");
  const rest = pending.length - 2;
  return {
    title,
    body: rest > 0 ? `${shown} e mais ${rest} esperam por você.` : `${shown} esperam por você.`,
  };
}

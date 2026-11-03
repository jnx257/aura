import { addDays, weekday, type LocalDate } from "@/lib/dates";
import type { MissedReason, Suggestion, TimeOfDay } from "./types";

/**
 * The adjustment offered for a missed task. Always a reschedule (MVP):
 * default → tomorrow (same period); too tired → tomorrow morning; unexpected event → the coming Saturday.
 */
export function suggestAdjustment(
  reason: MissedReason | null,
  timeOfDay: TimeOfDay | null,
  today: LocalDate,
): Suggestion {
  switch (reason) {
    case "too_tired":
      return { date: addDays(today, 1), timeOfDay: "morning" };
    case "unexpected": {
      // Saturday is weekday 5. On a Saturday, "the coming Saturday" is next week's.
      const ahead = (5 - weekday(today) + 7) % 7 || 7;
      return { date: addDays(today, ahead), timeOfDay };
    }
    default:
      return { date: addDays(today, 1), timeOfDay };
  }
}

/**
 * When an old suggestion is applied later (auto-adjust after the person was away), a date already in the past
 * would make the task instantly missed again; recompute it relative to today with the same reason.
 */
export function freshenSuggestion(
  suggestion: Suggestion,
  reason: MissedReason | null,
  originalTimeOfDay: TimeOfDay | null,
  today: LocalDate,
): Suggestion {
  return suggestion.date > today ? suggestion : suggestAdjustment(reason, originalTimeOfDay, today);
}

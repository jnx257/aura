import type { LocalDate } from "@/lib/dates";

export const TIMES_OF_DAY = ["morning", "afternoon", "evening"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export const HORIZONS = ["quarterly", "monthly", "yearly"] as const;
export type Horizon = (typeof HORIZONS)[number];

export const MISSED_REASONS = ["no_time", "too_tired", "lost_motivation", "unexpected", "other"] as const;
export type MissedReason = (typeof MISSED_REASONS)[number];

export const CYCLE_OUTCOMES = ["pending", "accepted", "declined", "ignored", "auto_applied", "resolved"] as const;
export type CycleOutcome = (typeof CYCLE_OUTCOMES)[number];

export const MOODS = ["good", "neutral", "low", "frustrated", "tired"] as const;
export type Mood = (typeof MOODS)[number];

/** Outcomes that close the feedback loop. "resolved" = person rescheduled or completed the task themselves. */
export const RESOLVING_OUTCOMES: readonly CycleOutcome[] = ["accepted", "auto_applied", "resolved"];
/** Outcomes that keep the loop open (count toward the 3-cycle auto-adjust). */
export const DECLINING_OUTCOMES: readonly CycleOutcome[] = ["declined", "ignored"];

export type Suggestion = { date: LocalDate; timeOfDay: TimeOfDay | null };

export type TaskFacts = {
  id: string;
  goalId: string | null;
  scheduledDate: LocalDate;
  timeOfDay: TimeOfDay | null;
  deadline: LocalDate | null;
  completedOn: LocalDate | null;
};

export type CycleFacts = {
  id: string;
  taskId: string;
  missedOn: LocalDate;
  openedOn: LocalDate;
  cycleNumber: number;
  reason: MissedReason | null;
  suggestedDate: LocalDate;
  suggestedTimeOfDay: TimeOfDay | null;
  outcome: CycleOutcome;
  resolvedOn: LocalDate | null;
};

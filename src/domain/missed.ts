import { addDays, localStamp, type LocalDate, type LocalNow } from "@/lib/dates";
import { freshenSuggestion, suggestAdjustment } from "./suggest";
import {
  DECLINING_OUTCOMES,
  RESOLVING_OUTCOMES,
  type CycleFacts,
  type Suggestion,
  type TaskFacts,
  type TimeOfDay,
} from "./types";

/** Minute of the day at which each period is considered over. No period = the whole day. */
export const PERIOD_END_MINUTES: Record<TimeOfDay | "none", number> = {
  morning: 12 * 60,
  afternoon: 18 * 60,
  evening: 22 * 60,
  none: 24 * 60,
};

/** Number of declined/ignored cycles in a row that triggers the auto-adjust. */
export const AUTO_APPLY_AFTER = 3;

/**
 * The local moment a task counts as missed if it is due on `day`: the end of its period,
 * or the end of its deadline day if that comes first (but never before `day` starts).
 */
export function missMoment(task: Pick<TaskFacts, "timeOfDay" | "deadline">, day: LocalDate): number {
  let moment = localStamp(day, PERIOD_END_MINUTES[task.timeOfDay ?? "none"]);
  if (task.deadline) {
    const deadlineEnd = localStamp(addDays(task.deadline, 1), 0);
    moment = Math.min(moment, Math.max(deadlineEnd, localStamp(day, 0)));
  }
  return moment;
}

export function isPastDue(task: TaskFacts, now: LocalNow): boolean {
  return !task.completedOn && localStamp(now.date, now.minutes) >= missMoment(task, task.scheduledDate);
}

/** Declined/ignored cycles since the last time the loop was closed for this task. */
export function declineStreak(cyclesOfTask: CycleFacts[]): number {
  let streak = 0;
  for (const c of [...cyclesOfTask].sort((a, b) => a.cycleNumber - b.cycleNumber)) {
    if (DECLINING_OUTCOMES.includes(c.outcome)) streak++;
    else if (RESOLVING_OUTCOMES.includes(c.outcome)) streak = 0;
  }
  return streak;
}

/** True when closing this cycle as declined/ignored is the 3rd in a row, so its suggestion gets applied. */
export function closesIntoAutoApply(cycle: CycleFacts, cyclesOfTask: CycleFacts[]): boolean {
  const others = cyclesOfTask.filter((c) => c.id !== cycle.id && c.cycleNumber < cycle.cycleNumber);
  return declineStreak(others) + 1 >= AUTO_APPLY_AFTER;
}

/**
 * The day for which a new feedback cycle should be opened, or null.
 * A goal-linked task that stays undone carries over: each further day it stays undone is another miss,
 * but at most one cycle is opened per local day and only one is ever pending.
 */
export function nextMissDay(task: TaskFacts, cyclesOfTask: CycleFacts[], now: LocalNow): LocalDate | null {
  if (!task.goalId || task.completedOn) return null;
  const last = [...cyclesOfTask].sort((a, b) => a.cycleNumber - b.cycleNumber).at(-1);
  if (last?.outcome === "pending") return null;
  if (last && last.openedOn >= now.date) return null;

  let candidate = task.scheduledDate;
  if (last && addDays(last.missedOn, 1) > candidate) candidate = addDays(last.missedOn, 1);

  const nowStamp = localStamp(now.date, now.minutes);
  // Latest day ≥ candidate whose miss moment has passed (today, else yesterday).
  for (const day of [now.date, addDays(now.date, -1)]) {
    if (day >= candidate && nowStamp >= missMoment(task, day)) return day;
  }
  return null;
}

export type ReconcilePlan = {
  /** Pending cycles left unanswered past their day: they become "ignored" (or "auto_applied"). */
  expire: { cycleId: string; taskId: string; autoApply: Suggestion | null }[];
  open: { taskId: string; missedOn: LocalDate; cycleNumber: number; suggestion: Suggestion }[];
};

/**
 * Pure core of the lazy reconcile that runs on every app request:
 * 1. pending cycles from an earlier day expire as ignored (ignoring = declining), possibly auto-applying;
 * 2. newly missed milestone tasks get a cycle opened today.
 */
export function planReconcile(tasks: TaskFacts[], cycles: CycleFacts[], now: LocalNow): ReconcilePlan {
  const plan: ReconcilePlan = { expire: [], open: [] };

  for (const original of tasks) {
    const task = { ...original };
    const ofTask = cycles.filter((c) => c.taskId === task.id).map((c) => ({ ...c }));

    for (const cycle of ofTask) {
      if (cycle.outcome !== "pending" || cycle.openedOn >= now.date) continue;
      let autoApply: Suggestion | null = null;
      if (!task.completedOn && closesIntoAutoApply(cycle, ofTask)) {
        autoApply = freshenSuggestion(
          { date: cycle.suggestedDate, timeOfDay: cycle.suggestedTimeOfDay },
          cycle.reason,
          task.timeOfDay,
          now.date,
        );
        cycle.outcome = "auto_applied";
        task.scheduledDate = autoApply.date;
        task.timeOfDay = autoApply.timeOfDay;
      } else {
        cycle.outcome = "ignored";
      }
      cycle.resolvedOn = now.date;
      plan.expire.push({ cycleId: cycle.id, taskId: task.id, autoApply });
    }

    const day = nextMissDay(task, ofTask, now);
    if (day) {
      plan.open.push({
        taskId: task.id,
        missedOn: day,
        cycleNumber: Math.max(0, ...ofTask.map((c) => c.cycleNumber)) + 1,
        suggestion: suggestAdjustment(null, task.timeOfDay, now.date),
      });
    }
  }
  return plan;
}

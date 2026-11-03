import { addDays, startOfWeek, type LocalDate } from "@/lib/dates";
import { RESOLVING_OUTCOMES, type CycleFacts, type TaskFacts } from "./types";

/** Soft limit: linking a 6th active task to a goal in the same week asks for confirmation. */
export const ACTIVE_TASKS_PER_GOAL_PER_WEEK = 5;
export const DRIFT_WINDOW_DAYS = 7;
export const DRIFT_MIN_MISSES = 2;

export type DriftState = "on_track" | "drifting";

/** Goal progress (MVP, unweighted): completed / total linked tasks. */
export function goalProgress(tasks: Pick<TaskFacts, "completedOn">[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.completedOn).length, total: tasks.length };
}

/** Active (incomplete) tasks of the goal scheduled in the same Monday-week as `day`. */
export function activeTasksInWeek(
  tasks: Pick<TaskFacts, "id" | "goalId" | "scheduledDate" | "completedOn">[],
  goalId: string,
  day: LocalDate,
  excludeTaskId?: string,
): number {
  const start = startOfWeek(day);
  const end = addDays(start, 6);
  return tasks.filter(
    (t) =>
      t.goalId === goalId &&
      t.id !== excludeTaskId &&
      !t.completedOn &&
      t.scheduledDate >= start &&
      t.scheduledDate <= end,
  ).length;
}

export function exceedsSoftLimit(activeCount: number): boolean {
  return activeCount >= ACTIVE_TASKS_PER_GOAL_PER_WEEK;
}

/**
 * Whether a miss had its feedback loop closed by `asOf`: this cycle or a later one of the same task was
 * accepted / auto-applied / resolved, or the task itself was completed.
 */
export function isMissResolved(
  cycle: CycleFacts,
  cyclesOfTask: CycleFacts[],
  task: Pick<TaskFacts, "completedOn">,
  asOf: LocalDate,
): boolean {
  if (task.completedOn && task.completedOn <= asOf) return true;
  return cyclesOfTask.some(
    (c) =>
      c.cycleNumber >= cycle.cycleNumber &&
      RESOLVING_OUTCOMES.includes(c.outcome) &&
      c.resolvedOn !== null &&
      c.resolvedOn <= asOf,
  );
}

export type GoalHealth = {
  drift: DriftState;
  /** Distinct tasks missed in the trailing 7 days (a task left undone several days counts once). */
  missesInWindow: number;
  /** Of those tasks, how many still have an open loop. */
  openMisses: number;
};

/**
 * Drift: 2+ missed milestone tasks in the trailing 7 days AND at least one of them unresolved.
 * A miss the person already closed the loop on keeps the goal on track.
 */
export function goalHealth(
  tasks: Pick<TaskFacts, "id" | "completedOn">[],
  cycles: CycleFacts[],
  asOf: LocalDate,
): GoalHealth {
  const from = addDays(asOf, -(DRIFT_WINDOW_DAYS - 1));
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const inWindow = cycles.filter(
    (c) => taskById.has(c.taskId) && c.missedOn >= from && c.missedOn <= asOf && c.openedOn <= asOf,
  );
  const missedTasks = new Set(inWindow.map((c) => c.taskId));
  const openTasks = new Set(
    inWindow
      .filter(
        (c) =>
          !isMissResolved(
            c,
            cycles.filter((o) => o.taskId === c.taskId),
            taskById.get(c.taskId)!,
            asOf,
          ),
      )
      .map((c) => c.taskId),
  );
  const drifting = missedTasks.size >= DRIFT_MIN_MISSES && openTasks.size > 0;
  return { drift: drifting ? "drifting" : "on_track", missesInWindow: missedTasks.size, openMisses: openTasks.size };
}

/** Distinct tasks missed in the current Monday-week. */
export function missesThisWeek(cycles: CycleFacts[], today: LocalDate): number {
  const start = startOfWeek(today);
  return new Set(cycles.filter((c) => c.missedOn >= start && c.missedOn <= today).map((c) => c.taskId)).size;
}

/**
 * Consecutive weeks (current one included) the goal ended on track, judged at each week's end
 * (or today for the current week). Counts back no further than the goal's creation week.
 */
export function weeksOnTrack(
  tasks: Pick<TaskFacts, "id" | "completedOn">[],
  cycles: CycleFacts[],
  today: LocalDate,
  createdOn: LocalDate,
): number {
  let weeks = 0;
  let weekStart = startOfWeek(today);
  const firstWeek = startOfWeek(createdOn);
  while (weekStart >= firstWeek && weeks < 52) {
    const end = addDays(weekStart, 6);
    const asOf = end < today ? end : today;
    if (goalHealth(tasks, cycles, asOf).drift === "drifting") break;
    weeks++;
    weekStart = addDays(weekStart, -7);
  }
  return weeks;
}

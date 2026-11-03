import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { goalHealth, goalProgress, missesThisWeek, weeksOnTrack } from "@/domain/goals";
import { declineStreak } from "@/domain/missed";
import { type LocalDate } from "@/lib/dates";
import { REASON_LABEL } from "@/lib/labels";
import type {
  ActivityView,
  GoalOption,
  GoalSummaryView,
  JournalEntryView,
  MissedPromptView,
  TaskView,
} from "@/lib/views";
import { db } from "./db/client";
import {
  feedbackCycles,
  goals,
  journalEntries,
  tasks,
  type FeedbackCycle,
  type Goal,
  type JournalEntry,
  type Task,
} from "./db/schema";

/**
 * Everything one person owns, loaded once per request. Personal-scale data (hundreds to low thousands of
 * rows) keeps this cheap; narrow these queries by date range if a user's history ever grows large.
 */
export const loadUserData = cache(async (userId: string) => {
  const [goalRows, taskRows, cycleRows, entryRows] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(goals.createdAt),
    db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.scheduledDate, tasks.createdAt),
    db.select().from(feedbackCycles).where(eq(feedbackCycles.userId, userId)),
    db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.entryDate), desc(journalEntries.createdAt)),
  ]);
  return new UserData(goalRows, taskRows, cycleRows, entryRows);
});

export class UserData {
  readonly goalById: Map<string, Goal>;
  readonly taskById: Map<string, Task>;
  readonly cyclesByTask = new Map<string, FeedbackCycle[]>();

  constructor(
    readonly goals: Goal[],
    readonly tasks: Task[],
    readonly cycles: FeedbackCycle[],
    readonly entries: JournalEntry[],
  ) {
    this.goalById = new Map(goals.map((g) => [g.id, g]));
    this.taskById = new Map(tasks.map((t) => [t.id, t]));
    for (const c of cycles) {
      const list = this.cyclesByTask.get(c.taskId) ?? [];
      list.push(c);
      this.cyclesByTask.set(c.taskId, list);
    }
    for (const list of this.cyclesByTask.values()) list.sort((a, b) => a.cycleNumber - b.cycleNumber);
  }

  goalOptions(): GoalOption[] {
    return this.goals.map((g) => ({ id: g.id, title: g.title }));
  }

  missedPrompt(cycle: FeedbackCycle, today: LocalDate): MissedPromptView {
    const task = this.taskById.get(cycle.taskId)!;
    const others = (this.cyclesByTask.get(task.id) ?? []).filter((c) => c.cycleNumber < cycle.cycleNumber);
    return {
      cycleId: cycle.id,
      taskTitle: task.title,
      goalTitle: task.goalId ? (this.goalById.get(task.goalId)?.title ?? null) : null,
      missedOn: cycle.missedOn,
      taskTimeOfDay: task.timeOfDay,
      reason: cycle.reason,
      reasonText: cycle.reasonText,
      priorStreak: declineStreak(others),
      today,
    };
  }

  taskView(task: Task, today: LocalDate): TaskView {
    const cycles = this.cyclesByTask.get(task.id) ?? [];
    const pending = cycles.find((c) => c.outcome === "pending");
    const lastClosed = cycles.filter((c) => c.outcome !== "pending" && c.reason).at(-1);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      goalId: task.goalId,
      goalTitle: task.goalId ? (this.goalById.get(task.goalId)?.title ?? null) : null,
      scheduledDate: task.scheduledDate,
      timeOfDay: task.timeOfDay,
      deadline: task.deadline,
      completed: task.completedOn !== null,
      overdue: !task.completedOn && task.scheduledDate < today,
      rescheduleCount: task.rescheduleCount,
      missed: pending ? this.missedPrompt(pending, today) : null,
      lastReason: (pending?.reason ?? lastClosed?.reason) || null,
    };
  }

  /** Today's list: tasks scheduled today plus undone ones carried over from earlier days. */
  todayTasks(today: LocalDate): TaskView[] {
    return this.tasks
      .filter((t) => t.scheduledDate === today || (t.scheduledDate < today && !t.completedOn))
      .map((t) => this.taskView(t, today));
  }

  tasksBetween(from: LocalDate, to: LocalDate, today: LocalDate): TaskView[] {
    return this.tasks
      .filter((t) => t.scheduledDate >= from && t.scheduledDate <= to)
      .map((t) => this.taskView(t, today));
  }

  goalSummary(goal: Goal, today: LocalDate): GoalSummaryView {
    const goalTasks = this.tasks.filter((t) => t.goalId === goal.id);
    const goalCycles = goalTasks.flatMap((t) => this.cyclesByTask.get(t.id) ?? []);
    const { done, total } = goalProgress(goalTasks);
    const health = goalHealth(goalTasks, goalCycles, today);
    return {
      id: goal.id,
      title: goal.title,
      category: goal.category,
      horizon: goal.horizon,
      done,
      total,
      ...health,
      missesThisWeek: missesThisWeek(goalCycles, today),
      weeksOnTrack: weeksOnTrack(goalTasks, goalCycles, today, goal.createdOn),
      reflections: this.entries.filter((e) => e.status === "saved" && e.goalId === goal.id).length,
    };
  }

  goalSummaries(today: LocalDate): GoalSummaryView[] {
    return this.goals.map((g) => this.goalSummary(g, today));
  }

  /** Completions, misses and journal entries in one chronological feed, newest first. */
  recentActivity(limit = 6): ActivityView[] {
    const items: ActivityView[] = [
      ...this.tasks
        .filter((t) => t.completedAt && t.completedOn)
        .map((t) => ({
          kind: "done" as const,
          label: t.title,
          day: t.completedOn!,
          at: t.completedAt!.getTime(),
        })),
      ...this.cycles.map((c) => ({
        kind: "missed" as const,
        label: this.taskById.get(c.taskId)?.title ?? "",
        day: c.missedOn,
        at: c.createdAt.getTime(),
      })),
      ...this.entries
        .filter((e) => e.status === "saved")
        .map((e) => ({
          kind: "wrote" as const,
          label: `“${e.title}”`,
          day: e.entryDate,
          at: e.createdAt.getTime(),
        })),
    ];
    return items.sort((a, b) => b.at - a.at).slice(0, limit);
  }

  entryView(e: JournalEntry): JournalEntryView {
    const task = e.taskId ? this.taskById.get(e.taskId) : undefined;
    const goal = e.goalId ? this.goalById.get(e.goalId) : undefined;
    const cycle = e.cycleId ? this.cycles.find((c) => c.id === e.cycleId) : undefined;
    const text =
      e.body.kind === "free" ? e.body.text : [e.body.happened, e.body.hindered, e.body.helps].join(" ");
    return {
      id: e.id,
      title: e.title,
      excerpt: text.trim().replace(/\s+/g, " ").slice(0, 160),
      mood: e.mood,
      entryDate: e.entryDate,
      status: e.status,
      chips: [
        task?.title,
        goal?.title,
        cycle?.reason ? (cycle.reasonText ?? REASON_LABEL[cycle.reason]) : undefined,
      ].filter((c): c is string => Boolean(c)),
      linkedToGoal: Boolean(goal),
    };
  }

  journal(filter: "all" | "goals" | "free"): JournalEntryView[] {
    return this.entries
      .filter((e) =>
        filter === "goals" ? e.goalId !== null : filter === "free" ? !e.goalId && !e.taskId : true,
      )
      .map((e) => this.entryView(e));
  }
}

export async function getEntry(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
    .limit(1);
  return row ?? null;
}

"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activeTasksInWeek, exceedsSoftLimit } from "@/domain/goals";
import { moveTaskSchema, taskSchema, type MoveTaskInput, type TaskInput } from "@/lib/schemas";
import { getAppContext } from "../context";
import { db } from "../db/client";
import { feedbackCycles, goals, tasks } from "../db/schema";
import { now } from "../clock";

export type SaveTaskResult =
  | { ok: true }
  | { ok: false; needsConfirm: true; activeCount: number }
  | { ok: false; error: string };

export async function saveTask(input: TaskInput): Promise<SaveTaskResult> {
  const { user, local } = await getAppContext();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, confirmSoftLimit, ...data } = parsed.data;

  if (data.goalId) {
    const [goal] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.id, data.goalId), eq(goals.userId, user.id)));
    if (!goal) return { ok: false, error: "Meta não encontrada" };
  }

  const existing = id
    ? (await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id))))[0]
    : undefined;
  if (id && !existing) return { ok: false, error: "Tarefa não encontrada" };

  // Soft limit: warn (never block) when this would be the 6th active task of the goal this week.
  const linkChanges =
    data.goalId && (!existing || existing.goalId !== data.goalId || existing.scheduledDate !== data.scheduledDate);
  if (data.goalId && linkChanges && !confirmSoftLimit) {
    const weekTasks = await db
      .select({
        id: tasks.id,
        goalId: tasks.goalId,
        scheduledDate: tasks.scheduledDate,
        completedOn: tasks.completedOn,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.goalId, data.goalId)));
    const count = activeTasksInWeek(weekTasks, data.goalId, data.scheduledDate, id);
    if (exceedsSoftLimit(count)) return { ok: false, needsConfirm: true, activeCount: count };
  }

  if (!existing) {
    await db.insert(tasks).values({ ...data, userId: user.id });
  } else {
    const rescheduled =
      existing.scheduledDate !== data.scheduledDate || existing.timeOfDay !== data.timeOfDay;
    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({
          ...data,
          rescheduleCount: rescheduled ? sql`${tasks.rescheduleCount} + 1` : undefined,
        })
        .where(eq(tasks.id, existing.id));
      // Rescheduling or unlinking it yourself closes an open "what got in the way?" loop.
      if (rescheduled || (existing.goalId && !data.goalId)) {
        await tx
          .update(feedbackCycles)
          .set({ outcome: "resolved", resolvedOn: local.date })
          .where(and(eq(feedbackCycles.taskId, existing.id), eq(feedbackCycles.outcome, "pending")));
      }
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export type MoveTaskResult = { ok: true } | { ok: false; error: string };

/**
 * Moves one task to another day without opening the editor. Like rescheduling in the editor, it closes an open
 * "what got in the way?" prompt for the task: the person has dealt with it themselves.
 */
export async function moveTask(input: MoveTaskInput): Promise<MoveTaskResult> {
  const { user, local } = await getAppContext();
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { taskId, scheduledDate } = parsed.data;
  if (scheduledDate < local.date) return { ok: false, error: "Escolha um dia de hoje em diante" };

  const [existing] = await db
    .select({ id: tasks.id, scheduledDate: tasks.scheduledDate })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
  if (!existing) return { ok: false, error: "Tarefa não encontrada" };

  if (existing.scheduledDate !== scheduledDate) {
    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ scheduledDate, rescheduleCount: sql`${tasks.rescheduleCount} + 1` })
        .where(and(eq(tasks.id, existing.id), eq(tasks.userId, user.id)));
      await tx
        .update(feedbackCycles)
        .set({ outcome: "resolved", resolvedOn: local.date })
        .where(and(eq(feedbackCycles.taskId, existing.id), eq(feedbackCycles.outcome, "pending")));
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setTaskDone(taskId: string, done: boolean) {
  const { user, local } = await getAppContext();
  await db.transaction(async (tx) => {
    const [task] = await tx
      .update(tasks)
      .set(done ? { completedAt: now(), completedOn: local.date } : { completedAt: null, completedOn: null })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
      .returning({ id: tasks.id });
    if (task && done) {
      await tx
        .update(feedbackCycles)
        .set({ outcome: "resolved", resolvedOn: local.date })
        .where(and(eq(feedbackCycles.taskId, task.id), eq(feedbackCycles.outcome, "pending")));
    }
  });
  revalidatePath("/", "layout");
}

export async function deleteTask(taskId: string) {
  const { user } = await getAppContext();
  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
  revalidatePath("/", "layout");
}

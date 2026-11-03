import "server-only";
import { and, eq, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { planReconcile } from "@/domain/missed";
import type { LocalNow } from "@/lib/dates";
import { db } from "./db/client";
import { feedbackCycles, tasks } from "./db/schema";

/**
 * Lazy, idempotent evaluation of everything time-based, run at the start of each app request:
 * expires unanswered prompts (ignoring = declining, with the 3-cycle auto-adjust) and opens prompts for
 * newly missed milestone tasks. No cron needed; a scheduled job could call this too.
 */
export async function reconcile(userId: string, local: LocalNow) {
  const due = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.completedOn),
        isNotNull(tasks.goalId),
        or(lte(tasks.scheduledDate, local.date), lte(tasks.deadline, local.date)),
      ),
    );
  const pendingTaskIds = (
    await db
      .select({ taskId: feedbackCycles.taskId })
      .from(feedbackCycles)
      .where(and(eq(feedbackCycles.userId, userId), eq(feedbackCycles.outcome, "pending")))
  ).map((r) => r.taskId);

  const taskIds = [...new Set([...due.map((t) => t.id), ...pendingTaskIds])];
  if (taskIds.length === 0) return;

  const relevantTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, taskIds)));
  const cycles = await db.select().from(feedbackCycles).where(inArray(feedbackCycles.taskId, taskIds));

  const plan = planReconcile(relevantTasks, cycles, local);
  if (plan.expire.length === 0 && plan.open.length === 0) return;

  await db.transaction(async (tx) => {
    for (const e of plan.expire) {
      const [closed] = await tx
        .update(feedbackCycles)
        .set({ outcome: e.autoApply ? "auto_applied" : "ignored", resolvedOn: local.date })
        .where(and(eq(feedbackCycles.id, e.cycleId), eq(feedbackCycles.outcome, "pending")))
        .returning({ id: feedbackCycles.id });
      if (closed && e.autoApply) {
        await tx
          .update(tasks)
          .set({
            scheduledDate: e.autoApply.date,
            timeOfDay: e.autoApply.timeOfDay,
            rescheduleCount: sql`${tasks.rescheduleCount} + 1`,
          })
          .where(eq(tasks.id, e.taskId));
      }
    }
    if (plan.open.length > 0) {
      await tx
        .insert(feedbackCycles)
        .values(
          plan.open.map((o) => ({
            userId,
            taskId: o.taskId,
            missedOn: o.missedOn,
            openedOn: local.date,
            cycleNumber: o.cycleNumber,
            suggestedDate: o.suggestion.date,
            suggestedTimeOfDay: o.suggestion.timeOfDay,
          })),
        )
        .onConflictDoNothing();
    }
  });
}

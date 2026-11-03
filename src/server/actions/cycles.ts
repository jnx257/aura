"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { closesIntoAutoApply } from "@/domain/missed";
import { suggestAdjustment } from "@/domain/suggest";
import { cycleResponseSchema, type CycleResponseInput } from "@/lib/schemas";
import { getAppContext } from "../context";
import { db } from "../db/client";
import { feedbackCycles, tasks } from "../db/schema";

export type CycleResponseResult = { ok: true; outcome: string } | { ok: false; error: string };

/**
 * Answer to "Couldn't complete X — what got in the way?".
 * accept → reschedule as suggested; decline → keep as is (the 3rd decline in a row applies the suggestion);
 * reflect → only record the reason, the prompt stays open while the person writes.
 */
export async function respondToCycle(input: CycleResponseInput): Promise<CycleResponseResult> {
  const { user, local } = await getAppContext();
  const parsed = cycleResponseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { cycleId, action, reason, reasonText } = parsed.data;

  const [cycle] = await db
    .select()
    .from(feedbackCycles)
    .where(and(eq(feedbackCycles.id, cycleId), eq(feedbackCycles.userId, user.id)));
  if (!cycle || cycle.outcome !== "pending") return { ok: false, error: "Esta pergunta já foi respondida" };
  const [task] = await db.select().from(tasks).where(eq(tasks.id, cycle.taskId));

  // Suggestions only ever come from this live flow, computed for today.
  const suggestion = suggestAdjustment(reason, task.timeOfDay, local.date);
  const answer = {
    reason,
    reasonText: reason === "other" ? reasonText : null,
    suggestedDate: suggestion.date,
    suggestedTimeOfDay: suggestion.timeOfDay,
  };

  if (action === "reflect") {
    await db.update(feedbackCycles).set(answer).where(eq(feedbackCycles.id, cycle.id));
    revalidatePath("/", "layout");
    return { ok: true, outcome: "pending" };
  }

  let outcome: "accepted" | "declined" | "auto_applied" = action === "accept" ? "accepted" : "declined";
  if (outcome === "declined") {
    const siblings = await db.select().from(feedbackCycles).where(eq(feedbackCycles.taskId, task.id));
    if (closesIntoAutoApply(cycle, siblings)) outcome = "auto_applied";
  }

  await db.transaction(async (tx) => {
    await tx
      .update(feedbackCycles)
      .set({ ...answer, outcome, resolvedOn: local.date })
      .where(eq(feedbackCycles.id, cycle.id));
    if (outcome !== "declined") {
      await tx
        .update(tasks)
        .set({
          scheduledDate: suggestion.date,
          timeOfDay: suggestion.timeOfDay,
          rescheduleCount: sql`${tasks.rescheduleCount} + 1`,
        })
        .where(eq(tasks.id, task.id));
    }
  });
  revalidatePath("/", "layout");
  return { ok: true, outcome };
}

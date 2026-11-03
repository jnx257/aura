"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { goalSchema, type GoalInput } from "@/lib/schemas";
import { getAppContext } from "../context";
import { db } from "../db/client";
import { goals } from "../db/schema";

export async function saveGoal(input: GoalInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { user, local } = await getAppContext();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  let savedId = id;
  if (id) {
    const [row] = await db
      .update(goals)
      .set(data)
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
      .returning({ id: goals.id });
    if (!row) return { ok: false, error: "Meta não encontrada" };
  } else {
    const [row] = await db
      .insert(goals)
      .values({ ...data, userId: user.id, createdOn: local.date })
      .returning({ id: goals.id });
    savedId = row.id;
  }
  revalidatePath("/", "layout");
  return { ok: true, id: savedId! };
}

/** Deleting a goal keeps its tasks as orphan tasks (FK on delete set null). */
export async function deleteGoal(goalId: string) {
  const { user } = await getAppContext();
  await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));
  revalidatePath("/", "layout");
}

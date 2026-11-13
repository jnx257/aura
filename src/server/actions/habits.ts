"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { habitSchema, type HabitInput } from "@/lib/schemas";
import { getAppContext } from "../context";
import { db } from "../db/client";
import { goals, habitLogs, habits } from "../db/schema";

export type SaveHabitResult = { ok: true } | { ok: false; error: string };

export async function saveHabit(input: HabitInput): Promise<SaveHabitResult> {
  const { user, local } = await getAppContext();
  const parsed = habitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  // The goal id comes from the browser: only link a goal this person owns.
  if (data.goalId) {
    const [goal] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.id, data.goalId), eq(goals.userId, user.id)));
    if (!goal) return { ok: false, error: "Meta não encontrada" };
  }

  if (!id) {
    await db.insert(habits).values({ ...data, userId: user.id, createdOn: local.date });
  } else {
    const [updated] = await db
      .update(habits)
      .set(data)
      .where(and(eq(habits.id, id), eq(habits.userId, user.id)))
      .returning({ id: habits.id });
    if (!updated) return { ok: false, error: "Hábito não encontrado" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marks a habit done (or not) for today, in the person's own calendar day. Asking twice changes nothing. */
export async function setHabitDone(habitId: string, done: boolean) {
  const { user, local } = await getAppContext();
  // The id comes from the browser: only act on a habit this person owns.
  const [habit] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));
  if (!habit) return;

  if (done) {
    await db
      .insert(habitLogs)
      .values({ userId: user.id, habitId: habit.id, day: local.date })
      .onConflictDoNothing({ target: [habitLogs.habitId, habitLogs.day] });
  } else {
    await db.delete(habitLogs).where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.day, local.date)));
  }
  revalidatePath("/", "layout");
}

/** Deleting a habit deletes its history with it (the foreign key cascades). */
export async function deleteHabit(habitId: string) {
  const { user } = await getAppContext();
  await db.delete(habits).where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));
  revalidatePath("/", "layout");
}

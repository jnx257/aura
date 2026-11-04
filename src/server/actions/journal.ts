"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { journalSchema, type JournalInput } from "@/lib/schemas";
import { getAppContext } from "../context";
import { db } from "../db/client";
import { feedbackCycles, goals, journalEntries, tasks, type JournalBody } from "../db/schema";

/** A title is optional: derive it from the first words written. */
function deriveTitle(body: JournalBody): string {
  const text = body.kind === "free" ? body.text : body.happened || body.hindered || body.helps;
  const firstLine = text.trim().split("\n")[0] ?? "";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57).trimEnd()}…` : firstLine;
}

export async function saveEntry(
  input: JournalInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { user, local } = await getAppContext();
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  // Links must point at the person's own data.
  const owns = async (table: typeof tasks | typeof goals | typeof feedbackCycles, rowId: string | null) =>
    !rowId ||
    (await db.select({ id: table.id }).from(table).where(and(eq(table.id, rowId), eq(table.userId, user.id))))
      .length === 1;
  if (!(await owns(tasks, data.taskId)) || !(await owns(goals, data.goalId)) || !(await owns(feedbackCycles, data.cycleId)))
    return { ok: false, error: "Vínculo inválido" };

  const values = { ...data, title: data.title || deriveTitle(data.body), updatedAt: new Date() };
  let savedId = id;
  if (id) {
    const [row] = await db
      .update(journalEntries)
      .set(values)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, user.id)))
      .returning({ id: journalEntries.id });
    if (!row) return { ok: false, error: "Reflexão não encontrada" };
  } else {
    const [row] = await db
      .insert(journalEntries)
      .values({ ...values, userId: user.id, entryDate: local.date })
      .returning({ id: journalEntries.id });
    savedId = row.id;
  }
  revalidatePath("/", "layout");
  return { ok: true, id: savedId! };
}

export async function deleteEntry(entryId: string) {
  const { user } = await getAppContext();
  await db.delete(journalEntries).where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, user.id)));
  revalidatePath("/", "layout");
}

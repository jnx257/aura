"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { pushSubscriptionSchema, reminderSchema, type PushSubscriptionInput } from "@/lib/schemas";
import { getAppContext } from "../context";
import { db } from "../db/client";
import { pushSubscriptions, users } from "../db/schema";
import { pushConfigured, sendPushToUser } from "../push";

export type ReminderResult = { ok: true } | { ok: false; error: string };

/** Sets the time of the daily routine reminder, or turns it off with null. */
export async function saveReminder(time: string | null): Promise<ReminderResult> {
  const { user } = await getAppContext();
  const parsed = reminderSchema.safeParse({ time });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  // A new time starts a fresh day: changing 8:00 to 20:00 after the 8:00 one went out should still send at 20:00.
  await db.update(users).set({ reminderTime: parsed.data.time, lastRemindedOn: null }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Remembers this device so it can be sent reminders. Registering the same device again only updates it. */
export async function savePushSubscription(input: PushSubscriptionInput): Promise<ReminderResult> {
  const { user } = await getAppContext();
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { endpoint, keys } = parsed.data;
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
  return { ok: true };
}

/** Forgets this device. Only the signed-in person's own devices can be removed. */
export async function removePushSubscription(endpoint: string): Promise<ReminderResult> {
  const { user } = await getAppContext();
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
  return { ok: true };
}

/** Sends one notification now, to every device of the signed-in person, to check that reminders arrive. */
export async function sendTestReminder(): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  const { user } = await getAppContext();
  if (!pushConfigured()) return { ok: false, error: "Os lembretes ainda não foram configurados no servidor." };
  const { sent } = await sendPushToUser(user.id, {
    title: "Aura",
    body: "Teste: o lembrete da rotina está funcionando.",
    tag: "aura-test",
    url: "/hoje",
  });
  return sent > 0 ? { ok: true, sent } : { ok: false, error: "Nenhum aparelho recebeu. Ative o lembrete neste aparelho." };
}

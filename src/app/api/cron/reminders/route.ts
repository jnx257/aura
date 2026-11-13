import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { pendingHabits, reminderMessage, shouldRemind } from "@/domain/reminder";
import { localNow } from "@/lib/dates";
import { now } from "@/server/clock";
import { db } from "@/server/db/client";
import { habitLogs, habits, users } from "@/server/db/schema";
import { pushConfigured, sendPushToUser } from "@/server/push";

export const dynamic = "force-dynamic";

/** Compares two secrets without leaking, through timing, how much of one matched. */
function sameSecret(given: string, expected: string): boolean {
  const hash = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(hash(given), hash(expected));
}

/**
 * Sends the routine reminders that are due. An outside scheduler calls this every few minutes with
 * `Authorization: Bearer $CRON_SECRET` (see README). It is safe to call as often as you like: each person gets at
 * most one reminder per day, and only while habits are still unmarked.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: with no secret configured the route does nothing instead of being open to anyone.
  if (!secret) return Response.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!sameSecret(given, secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: "VAPID keys are not set" }, { status: 503 });

  const people = await db.select().from(users).where(isNotNull(users.reminderTime));
  let sent = 0;
  for (const person of people) {
    const local = localNow(person.timezone, now());
    const [habitRows, logRows] = await Promise.all([
      db.select().from(habits).where(eq(habits.userId, person.id)).orderBy(habits.createdAt),
      db.select({ habitId: habitLogs.habitId }).from(habitLogs).where(and(eq(habitLogs.userId, person.id), eq(habitLogs.day, local.date))),
    ]);
    const pending = pendingHabits(habitRows, new Set(logRows.map((l) => l.habitId)), local.date);
    if (!shouldRemind({ reminderTime: person.reminderTime, lastRemindedOn: person.lastRemindedOn, local, pending })) continue;

    const result = await sendPushToUser(person.id, { ...reminderMessage(pending), tag: "aura-routine", url: "/hoje" });
    // Only a reminder that reached a device counts as the day's reminder; otherwise the next call tries again.
    if (result.sent > 0) {
      await db.update(users).set({ lastRemindedOn: local.date }).where(eq(users.id, person.id));
      sent++;
    }
  }
  return Response.json({ checked: people.length, sent });
}

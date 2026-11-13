import "server-only";
import { eq, inArray } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";
import { db } from "./db/client";
import { pushSubscriptions } from "./db/schema";

export type PushPayload = { title: string; body: string; tag?: string; url?: string };

/** True when the three VAPID values are set; without them nothing can be sent, and the UI says so. */
export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

/**
 * Sends a notification to every device a person has registered. A device the push service says is gone (404 or 410:
 * the app was uninstalled, or the permission taken back) is forgotten, so it is never tried again.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  const gone: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          // A reminder that could not be delivered within a few hours is not worth delivering.
          { TTL: 6 * 60 * 60, timeout: 10_000 },
        );
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(sub.id);
        else console.error("push failed", status ?? (error as Error).message);
      }
    }),
  );
  if (gone.length > 0) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  return { sent, removed: gone.length };
}

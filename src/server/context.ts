import "server-only";
import { cache } from "react";
import { localNow } from "@/lib/dates";
import { requireUser } from "./auth";
import { now } from "./clock";
import { reconcile } from "./reconcile";

/** Signed-in user + their local "now", with time-based state reconciled. Once per request. */
export const getAppContext = cache(async () => {
  const user = await requireUser();
  const local = localNow(user.timezone, now());
  await reconcile(user.id, local);
  return { user, local };
});

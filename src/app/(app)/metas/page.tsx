import type { Metadata } from "next";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { GoalsSplit } from "./goal-views";

export const metadata: Metadata = { title: "Metas" };

export default async function GoalsPage() {
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  // Desktop opens the first goal beside the list; phones show just the list.
  return <GoalsSplit data={data} today={local.date} selectedId={data.goals[0]?.id ?? null} mobileView="list" />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { GoalsSplit } from "../goal-views";

export const metadata: Metadata = { title: "Meta" };

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  if (!data.goalById.has(id)) notFound();
  return <GoalsSplit data={data} today={local.date} selectedId={id} mobileView="detail" />;
}

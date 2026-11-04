import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHIP, REASON_LABEL } from "@/lib/labels";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { JournalList, ReflectSplit } from "../journal-list";
import { JournalEditor, type EditorSeed } from "./journal-editor";

export const metadata: Metadata = { title: "Escrever" };

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ciclo?: string }>;
}) {
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  const { id, ciclo } = await searchParams;

  const entry = id ? data.entries.find((e) => e.id === id) : undefined;
  if (id && !entry) notFound();

  // Inbound from a missed task: the task, its goal and the reason arrive pre-filled.
  const cycleId = entry?.cycleId ?? ciclo ?? null;
  const cycle = cycleId ? data.cycles.find((c) => c.id === cycleId) : undefined;
  const taskId = entry ? entry.taskId : (cycle?.taskId ?? null);
  const task = taskId ? data.taskById.get(taskId) : undefined;
  const goalId = entry ? entry.goalId : (task?.goalId ?? null);
  const goal = goalId ? data.goalById.get(goalId) : undefined;

  const seed: EditorSeed = {
    id: entry?.id,
    status: entry?.status ?? "draft",
    entryDate: entry?.entryDate ?? local.date,
    title: entry?.title ?? "",
    body: entry?.body ?? (cycle ? { kind: "guided", happened: "", hindered: "", helps: "" } : { kind: "free", text: "" }),
    mood: entry?.mood ?? null,
    taskId: task?.id ?? null,
    goalId: goal?.id ?? null,
    cycleId: cycle?.id ?? null,
    chips: [task?.title, goal ? CHIP.goal(goal.title) : undefined].filter((c): c is string => Boolean(c)),
    reasonChip: cycle?.reason ? CHIP.reason(cycle.reasonText ?? REASON_LABEL[cycle.reason]) : null,
  };

  return (
    <ReflectSplit
      listOnMobile={false}
      list={<JournalList entries={data.journal("all")} filter="all" today={local.date} selectedId={entry?.id} />}
    >
      <JournalEditor key={entry?.id ?? cycleId ?? "new"} seed={seed} />
    </ReflectSplit>
  );
}

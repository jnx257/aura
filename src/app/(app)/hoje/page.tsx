import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity-feed";
import { GoalsOverview } from "@/components/goals";
import { RoutineSection } from "@/components/routine";
import { TaskList } from "@/components/task-row";
import { SectionLabel } from "@/components/ui";
import { TIMES_OF_DAY, type TimeOfDay } from "@/domain/types";
import { formatDayLong, greeting } from "@/lib/dates";
import type { TaskView } from "@/lib/views";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { EmptyToday } from "./empty-today";

export const metadata: Metadata = { title: "Hoje" };

const GROUP_LABEL: Record<TimeOfDay | "none", string> = {
  morning: "MANHÃ",
  afternoon: "TARDE",
  evening: "NOITE",
  none: "A QUALQUER HORA",
};

/** Missed first (they need an answer), then goal-linked, then loose tasks, done last. */
function rank(t: TaskView) {
  if (t.completed) return 3;
  if (t.missed) return 0;
  return t.goalId ? 1 : 2;
}

export default async function TodayPage() {
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  const tasks = data.todayTasks(local.date).sort((a, b) => rank(a) - rank(b));
  const goals = data.goalSummaries(local.date);
  const habits = data.habitViews(local.date);
  const goalLinked = tasks.filter((t) => t.goalId).length;
  const firstName = user.name.trim().split(/\s+/)[0];

  const groups = ([...TIMES_OF_DAY, "none"] as const)
    .map((slot) => ({ slot, tasks: tasks.filter((t) => (t.timeOfDay ?? "none") === slot) }))
    .filter((g) => g.tasks.length > 0);

  return (
    <main className="px-5 pt-5 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-12 lg:pt-8 lg:pb-12">
      <div className="flex flex-col gap-[18px] lg:gap-[22px]">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em] lg:text-[32px] lg:font-semibold">
            {greeting(local.minutes)}, {firstName}.
          </h1>
          <p className="mt-1.5 text-xs text-muted lg:text-sm">
            {formatDayLong(local.date)} · {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"} · {goalLinked}{" "}
            de metas
          </p>
        </div>

        <GoalsOverview goals={goals} variant="strip" />

        <RoutineSection habits={habits} />

        {groups.length === 0 && <EmptyToday />}
        {groups.map((g) => (
          <section key={g.slot}>
            <SectionLabel className="mb-1.5">{GROUP_LABEL[g.slot]}</SectionLabel>
            <TaskList tasks={g.tasks} />
          </section>
        ))}
        {tasks.length > 0 && tasks.every((t) => t.completed) && (
          <p className="animate-rise text-sm text-muted">Tudo em dia por hoje. O resto pode esperar.</p>
        )}
      </div>

      <aside className="hidden flex-col gap-5 lg:flex">
        <GoalsOverview goals={goals} variant="panel" />
        <ActivityFeed items={data.recentActivity()} today={local.date} />
      </aside>
    </main>
  );
}

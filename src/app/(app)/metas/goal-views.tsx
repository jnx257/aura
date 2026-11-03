import Link from "next/link";
import { GoalCard, goalMeta } from "@/components/goals";
import { TaskList } from "@/components/task-row";
import { DriftBadge, SectionLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDayCaps, type LocalDate } from "@/lib/dates";
import { MOOD_LABEL } from "@/lib/labels";
import type { GoalSummaryView, TaskView } from "@/lib/views";
import type { UserData } from "@/server/queries";
import { AddGoalButton, AddTaskToGoal, EditGoalButton } from "./goal-actions";

/** Desktop: list + detail side by side. Phone: only the list (on /metas) or only the detail (on /metas/[id]). */
export function GoalsSplit({
  data,
  today,
  selectedId,
  mobileView,
}: {
  data: UserData;
  today: LocalDate;
  selectedId: string | null;
  mobileView: "list" | "detail";
}) {
  const goals = data.goalSummaries(today);
  const selected = goals.find((g) => g.id === selectedId) ?? null;

  return (
    <main className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[360px_minmax(0,1fr)]">
      <div
        className={cn(
          "flex-col gap-3 px-5 pt-4 pb-12 lg:flex lg:gap-2.5 lg:border-r lg:border-line lg:p-6",
          mobileView === "list" ? "flex" : "hidden",
        )}
      >
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} href={`/metas/${g.id}`} selected={g.id === selected?.id} />
        ))}
        <AddGoalButton first={goals.length === 0} />
      </div>
      {selected ? (
        <div className={cn(mobileView === "list" && "hidden lg:block")}>
          <GoalDetail goal={selected} data={data} today={today} />
        </div>
      ) : (
        <div className="hidden items-center justify-center p-12 text-sm text-muted lg:flex">
          {goals.length === 0 ? "Crie uma meta para começar." : "Escolha uma meta."}
        </div>
      )}
    </main>
  );
}

function sortGoalTasks(tasks: TaskView[]) {
  const rank = (t: TaskView) => (t.missed ? 0 : t.completed ? 2 : 1);
  return [...tasks].sort(
    (a, b) => rank(a) - rank(b) || (rank(a) === 2 ? -1 : 1) * a.scheduledDate.localeCompare(b.scheduledDate),
  );
}

function GoalDetail({ goal, data, today }: { goal: GoalSummaryView; data: UserData; today: LocalDate }) {
  const all = data.tasks.filter((t) => t.goalId === goal.id).map((t) => data.taskView(t, today));
  const done = all.filter((t) => t.completed);
  const tasks = sortGoalTasks([...all.filter((t) => !t.completed), ...done.slice(-5)]);
  const entries = data.entries.filter((e) => e.goalId === goal.id && e.status === "saved");
  const pct = goal.total === 0 ? 0 : Math.round((goal.done / goal.total) * 100);

  return (
    <section className="flex max-w-[820px] flex-col gap-[18px] px-5 pt-3 pb-12 lg:gap-5 lg:px-12 lg:pt-7">
      <div className="flex justify-between text-[13px] text-muted lg:hidden">
        <Link href="/metas">← Metas</Link>
        <EditGoalButton goal={goal} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted lg:text-xs">{goalMeta(goal)}</div>
          <h1 className="mt-1.5 text-[26px] font-medium tracking-[-0.02em] lg:mt-1 lg:text-[32px] lg:font-semibold">
            {goal.title}
          </h1>
        </div>
        <div className="flex items-center gap-3 pb-1.5">
          <span className="hidden lg:inline">
            <EditGoalButton goal={goal} />
          </span>
          <DriftBadge drift={goal.drift} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-line bg-surface">
        <Stat value={`${pct}%`} label={`${goal.done} de ${goal.total} feitas`} />
        <Stat value={String(goal.missesInWindow)} label="perdidas, 7 dias" red={goal.missesInWindow > 0} border />
        <Stat value={String(goal.openMisses)} label="em aberto" border />
      </div>

      {goal.drift === "drifting" && (
        <p className="rounded-2xl bg-miss-bg px-4 py-3.5 text-xs leading-relaxed lg:px-[18px] lg:text-sm">
          <span className="font-semibold text-miss-strong lg:font-bold">Desviando.</span>{" "}
          {goal.openMisses === 1
            ? "Uma tarefa perdida nos últimos 7 dias ainda não foi resolvida. Resolvê-la traz a meta de volta ao rumo."
            : `${goal.openMisses} tarefas perdidas nos últimos 7 dias ainda não foram resolvidas. Resolvê-las traz a meta de volta ao rumo.`}
        </p>
      )}

      <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel>Tarefas</SectionLabel>
            <AddTaskToGoal goalId={goal.id} />
          </div>
          {tasks.length > 0 ? (
            <TaskList tasks={tasks} context="goal" />
          ) : (
            <p className="rounded-2xl border border-dashed border-dash-strong p-4 text-center text-[13px] text-muted">
              Nenhuma tarefa ligada a esta meta ainda.
            </p>
          )}
        </div>

        {/* Reflections keep the journal's dim palette even inside the light "do" mode. */}
        <div>
          <SectionLabel className="mb-1.5 hidden lg:block">Reflexões · {entries.length}</SectionLabel>
          <Link
            data-mode="reflect"
            href="/refletir?filtro=metas"
            className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3.5 text-[13px] text-ink lg:hidden"
          >
            <span>
              {entries.length} {entries.length === 1 ? "reflexão vinculada" : "reflexões vinculadas"}
            </span>
            <span>Refletir →</span>
          </Link>
          <div data-mode="reflect" className="hidden rounded-2xl bg-surface px-4 py-1 text-ink lg:block">
            {entries.length === 0 && <p className="py-3 text-[13px] text-muted">Nenhuma reflexão ainda.</p>}
            {entries.slice(0, 6).map((e, i) => (
              <Link
                key={e.id}
                href={`/refletir/escrever?id=${e.id}`}
                className={cn("block py-3", i > 0 && "border-t border-line")}
              >
                <div className="text-[11px] tracking-[0.06em] text-muted">
                  {formatDayCaps(e.entryDate)}
                  {e.mood && ` · ${MOOD_LABEL[e.mood].toUpperCase()}`}
                </div>
                <div className="mt-1 text-sm font-semibold">{e.title || "Sem título"}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, red, border }: { value: string; label: string; red?: boolean; border?: boolean }) {
  return (
    <div className={cn("p-3.5 lg:px-[18px] lg:py-4", border && "border-l border-divider")}>
      <div className={cn("text-xl font-medium lg:text-2xl lg:font-semibold", red && "text-miss")}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted lg:text-xs">{label}</div>
    </div>
  );
}

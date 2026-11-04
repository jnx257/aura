import Link from "next/link";
import { HORIZON_LABEL } from "@/lib/labels";
import type { GoalSummaryView } from "@/lib/views";
import { cn } from "@/lib/cn";
import { GoalLink } from "./hold-link";
import { DriftBadge, ProgressBar } from "./ui";

export function goalMeta(goal: GoalSummaryView) {
  return [HORIZON_LABEL[goal.horizon], goal.category].filter(Boolean).join(" · ");
}

/** "3 perdidas nesta semana · 2 em aberto" / "1 perdida, resolvida · 4 semanas no rumo" */
export function consistencyLine(goal: GoalSummaryView) {
  const m = goal.missesThisWeek;
  const misses =
    m === 0
      ? "Nenhuma perdida"
      : goal.openMisses === 0
        ? `${m} ${m === 1 ? "perdida, resolvida" : "perdidas, resolvidas"}`
        : `${m} ${m === 1 ? "perdida" : "perdidas"} nesta semana`;
  const tail =
    goal.drift === "drifting" || goal.openMisses > 0
      ? `${goal.openMisses} em aberto`
      : `${goal.weeksOnTrack} ${goal.weeksOnTrack === 1 ? "semana" : "semanas"} no rumo`;
  return `${misses} · ${tail}`;
}

/** Card used in the goals list (mobile 2e, desktop 3d left column). */
export function GoalCard({ goal, selected, href }: { goal: GoalSummaryView; selected?: boolean; href: string }) {
  return (
    <GoalLink
      goalId={goal.id}
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl bg-surface px-4 py-3.5 transition-colors",
        selected ? "border-[1.5px] border-ink" : "border border-line hover:border-dash",
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <div className="text-[15px] font-medium lg:font-semibold">{goal.title}</div>
          <div className="mt-[3px] text-[11px] text-muted">{goalMeta(goal)}</div>
        </div>
        <DriftBadge drift={goal.drift} />
      </div>
      <div className="flex items-center gap-2.5">
        <ProgressBar done={goal.done} total={goal.total} drift={goal.drift} />
        <span className="text-[11px]">
          {goal.done}/{goal.total}
        </span>
      </div>
      <div className="text-[11px] text-muted lg:hidden">{consistencyLine(goal)}</div>
    </GoalLink>
  );
}

/** Compact goal overview on Hoje: horizontal cards on phones, a list panel on desktop. */
export function GoalsOverview({ goals, variant }: { goals: GoalSummaryView[]; variant: "strip" | "panel" }) {
  if (goals.length === 0) {
    return (
      <Link
        href="/metas"
        className={cn(
          "rounded-2xl border border-dashed border-dash-strong p-3.5 text-center text-[13px] text-muted",
          variant === "strip" ? "block lg:hidden" : "hidden lg:block",
        )}
      >
        + Crie sua primeira meta
      </Link>
    );
  }
  if (variant === "strip") {
    return (
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
        {goals.map((g) => (
          <GoalLink
            key={g.id}
            goalId={g.id}
            href={`/metas/${g.id}`}
            className="flex w-[148px] flex-none flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3"
          >
            <span className="self-start">
              <DriftBadge drift={g.drift} />
            </span>
            <span className="truncate text-sm font-medium">{g.title}</span>
            <ProgressBar done={g.done} total={g.total} drift={g.drift} />
          </GoalLink>
        ))}
      </div>
    );
  }
  return (
      <div className="hidden rounded-2xl border border-line bg-surface px-[18px] py-1.5 lg:block">
        <div className="flex justify-between pt-3 pb-1.5">
          <span className="text-[11px] tracking-[0.08em] text-muted">METAS</span>
          <Link href="/metas" className="text-xs text-muted hover:text-ink">
            Todas →
          </Link>
        </div>
        {goals.map((g) => (
          <GoalLink
            key={g.id}
            goalId={g.id}
            href={`/metas/${g.id}`}
            className="flex flex-col gap-2 border-t border-divider py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{g.title}</span>
              <DriftBadge drift={g.drift} />
            </div>
            <div className="flex items-center gap-2.5">
              <ProgressBar done={g.done} total={g.total} drift={g.drift} />
              <span className="text-[11px] text-muted">
                {g.done}/{g.total}
              </span>
            </div>
          </GoalLink>
        ))}
      </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { TaskList } from "@/components/task-row";
import { SectionLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { addDays, formatDayCaps, formatWeekRange, isValidLocalDate, startOfWeek, weekDays, weekdayShort } from "@/lib/dates";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { DayColumn } from "./day-column";

export const metadata: Metadata = { title: "Semana" };

export default async function WeekPage({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  const { de } = await searchParams;
  const anchor = de && isValidLocalDate(de) ? de : local.date;
  const days = weekDays(anchor);
  const tasks = data.tasksBetween(days[0], days[6], local.date);
  const byDay = days.map((day) => ({ day, tasks: tasks.filter((t) => t.scheduledDate === day) }));
  const start = startOfWeek(anchor);
  const isCurrent = start === startOfWeek(local.date);

  return (
    <main className="px-5 pt-4 pb-28 lg:px-10 lg:pt-7 lg:pb-12">
      <div className="mb-3.5 flex items-center justify-between lg:mb-4">
        <h1 className="text-lg font-semibold tracking-[-0.02em] lg:text-2xl">{formatWeekRange(anchor)}</h1>
        <nav className="flex items-center gap-1 text-sm text-muted" aria-label="Semanas">
          <Link href={`/semana?de=${addDays(start, -7)}`} className="rounded-lg px-2.5 py-1.5 hover:bg-sunken" aria-label="Semana anterior">
            ←
          </Link>
          {!isCurrent && (
            <Link href="/semana" className="rounded-lg px-2.5 py-1.5 hover:bg-sunken">
              Esta semana
            </Link>
          )}
          <Link href={`/semana?de=${addDays(start, 7)}`} className="rounded-lg px-2.5 py-1.5 hover:bg-sunken" aria-label="Próxima semana">
            →
          </Link>
        </nav>
      </div>

      {/* Phone: day strip + per-day lists */}
      <div className="flex flex-col gap-3.5 lg:hidden">
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day) => (
            <a
              key={day}
              href={`#dia-${day}`}
              className={cn(
                "flex flex-col gap-1 rounded-xl py-2",
                day === local.date && "bg-ink text-on-ink",
              )}
            >
              <span className={cn("text-[11px]", day !== local.date && "text-muted")}>
                {weekdayShort(day).toUpperCase()}
              </span>
              <span className={cn("text-[15px]", day === local.date && "font-medium")}>{Number(day.slice(8))}</span>
            </a>
          ))}
        </div>
        {byDay.every((d) => d.tasks.length === 0) && (
          <p className="py-8 text-center text-sm text-muted">Nenhuma tarefa nesta semana.</p>
        )}
        {byDay
          .filter((d) => d.tasks.length > 0)
          .map((d) => (
            <section key={d.day} id={`dia-${d.day}`} className="scroll-mt-4">
              <SectionLabel className="mb-1.5">{formatDayCaps(d.day)}</SectionLabel>
              <TaskList tasks={d.tasks} context="week" />
            </section>
          ))}
      </div>

      {/* Desktop: seven columns */}
      <div className="hidden grid-cols-7 gap-2 lg:grid">
        {byDay.map((d) => (
          <DayColumn key={d.day} day={d.day} isToday={d.day === local.date} tasks={d.tasks} />
        ))}
      </div>
    </main>
  );
}

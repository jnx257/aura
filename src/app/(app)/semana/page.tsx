import type { Metadata } from "next";
import { TaskList } from "@/components/task-row";
import { SectionLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  addDays,
  formatDayCaps,
  formatWeekRange,
  isValidLocalDate,
  startOfWeek,
  weekDays,
  weekdayShort,
} from "@/lib/dates";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { DayColumn } from "./day-column";
import { EmptyDay } from "./empty-day";
import { WeekNav, WeekSwap } from "./week-motion";

export const metadata: Metadata = { title: "Semana" };

/** What a day chip says to a screen reader: the day and how full it is. */
function dayLabel(day: string, count: number) {
  const name = formatDayCaps(day);
  return count === 0 ? `${name}, nada planejado` : `${name}, ${count} ${count === 1 ? "tarefa" : "tarefas"}`;
}

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
        <WeekSwap key={start}>
          <h1 className="text-lg font-semibold tracking-[-0.02em] lg:text-2xl">{formatWeekRange(anchor)}</h1>
        </WeekSwap>
        <WeekNav
          previousHref={`/semana?de=${addDays(start, -7)}`}
          nextHref={`/semana?de=${addDays(start, 7)}`}
          currentHref="/semana"
          showCurrent={!isCurrent}
          currentDirection={start > startOfWeek(local.date) ? "prev" : "next"}
        />
      </div>

      {/* A plain wrapper: <main>’s direct children get the page-entrance rise (see globals.css), which would
          override the sideways slide if WeekSwap were one of them. */}
      <div>
        <WeekSwap key={start}>
          {/* Phone: day strip + per-day lists */}
          <div className="flex flex-col gap-3.5 lg:hidden">
            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((day) => (
                <a
                  key={day}
                  href={`#dia-${day}`}
                  aria-current={day === local.date ? "date" : undefined}
                  aria-label={dayLabel(day, byDay.find((d) => d.day === day)?.tasks.length ?? 0)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2 transition-colors active:scale-[0.97]",
                    day === local.date ? "bg-ink text-on-ink" : "hover:bg-sunken",
                  )}
                >
                  <span className={cn("text-[11px]", day !== local.date && "text-muted")}>
                    {weekdayShort(day).toUpperCase()}
                  </span>
                  <span className={cn("text-[15px]", day === local.date && "font-medium")}>
                    {Number(day.slice(8))}
                  </span>
                  {/* A dot says the day has something planned; no dot, it is open. */}
                  <span
                    aria-hidden
                    className={cn(
                      "size-1 rounded-full",
                      byDay.find((d) => d.day === day)?.tasks.length
                        ? day === local.date
                          ? "bg-on-ink"
                          : "bg-ink"
                        : "bg-transparent",
                    )}
                  />
                </a>
              ))}
            </div>
            {byDay.map((d) => (
              <section key={d.day} id={`dia-${d.day}`} className="scroll-mt-4">
                <SectionLabel className="mb-1.5">{formatDayCaps(d.day)}</SectionLabel>
                {d.tasks.length > 0 ? <TaskList tasks={d.tasks} context="week" /> : <EmptyDay day={d.day} />}
              </section>
            ))}
          </div>

          {/* Desktop: seven columns */}
          <div className="hidden grid-cols-7 gap-2 lg:grid">
            {byDay.map((d) => (
              <DayColumn key={d.day} day={d.day} isToday={d.day === local.date} tasks={d.tasks} />
            ))}
          </div>
        </WeekSwap>
      </div>
    </main>
  );
}

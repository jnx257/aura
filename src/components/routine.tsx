"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { EVERY_DAY } from "@/domain/habits";
import type { HabitView } from "@/lib/views";
import { saveHabit, setHabitDone } from "@/server/actions/habits";
import { useShell } from "./shell";
import { Checkbox, SectionLabel, cn } from "./ui";

/** The last seven days of a habit as small dots: filled when done, hollow when it applied and was not marked. */
function WeekDots({ habit }: { habit: HabitView }) {
  return (
    <span
      role="img"
      aria-label={`Últimos 7 dias: ${habit.weekDone} de ${habit.weekDue} feitos`}
      className="flex flex-none items-center gap-1"
    >
      {habit.strip.map((s) => (
        <span
          key={s.day}
          className={cn(
            "size-[7px] rounded-full transition-colors",
            s.state === "done" && "bg-ok",
            s.state === "open" && "border border-dash",
            s.state === "rest" && "bg-divider",
            s.state === "before" && "bg-transparent",
          )}
        />
      ))}
    </span>
  );
}

/** What sits under the title: the run if there is one, else how the week is going. Never a count of failures. */
function subline(h: HabitView): string {
  if (!h.dueToday && !h.doneToday) return "Folga hoje";
  if (h.streak >= 2) return `${h.streak} dias seguidos`;
  if (h.weekDue === 0) return "Começa hoje";
  return `${h.weekDone} de ${h.weekDue} nesta semana`;
}

/** One habit: tap the box to mark today, tap the name to edit. Also used on a goal's page. */
export function HabitRow({ habit, showGoal = false }: { habit: HabitView; showGoal?: boolean }) {
  const { openHabitEditor } = useShell();
  const [done, setDone] = useOptimistic(habit.doneToday);
  const [ticked, setTicked] = useState(false);
  const [, startTransition] = useTransition();

  const toggle = () => {
    setTicked(!done);
    startTransition(async () => {
      setDone(!done);
      await setHabitDone(habit.id, !done);
    });
  };

  return (
    <div className="relative flex items-center gap-3 border-t border-divider py-3 first:border-t-0 lg:gap-3.5 lg:py-[13px]">
      <Checkbox
        state={done ? "done" : "open"}
        justDone={done && ticked}
        onToggle={toggle}
        label={done ? `Desmarcar ${habit.title}` : `Marcar ${habit.title}`}
      />
      <button
        type="button"
        onClick={() => openHabitEditor(habit)}
        className="-my-1 -mr-1.5 min-w-0 flex-1 rounded-lg py-1 pr-1.5 text-left"
      >
        <div
          className={cn(
            "truncate text-sm transition-colors lg:text-[15px]",
            done ? "text-muted line-through" : habit.dueToday ? "font-medium" : "text-muted",
          )}
        >
          {habit.title}
        </div>
        <div className="mt-[3px] truncate text-[11px] text-muted lg:text-xs">
          {showGoal && habit.goalTitle ? `${habit.goalTitle} · ${subline(habit)}` : subline(habit)}
        </div>
      </button>
      <WeekDots habit={habit} />
    </div>
  );
}

/**
 * The fastest way to start a habit: type its name and press Enter. It comes back every day; the days and the goal it
 * works towards can be set afterwards by tapping the habit (or up front with "Repetir" when creating a task).
 */
function QuickAddHabit({ first }: { first: boolean }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setError(null);
        startTransition(async () => {
          const result = await saveHabit({ title, days: EVERY_DAY, goalId: null });
          if (!result.ok) return setError(result.error);
          setTitle("");
          input.current?.focus(); // ready for the next one
        });
      }}
      className={cn(
        "flex items-center gap-3 py-3 lg:gap-3.5 lg:py-[13px]",
        !first && "border-t border-divider",
      )}
    >
      <span aria-hidden className="flex size-[22px] flex-none items-center justify-center text-lg text-muted">
        +
      </span>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Novo hábito</span>
        <input
          ref={input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          maxLength={120}
          enterKeyHint="done"
          placeholder={first ? "Escreva um hábito e aperte Enter" : "Novo hábito, todo dia"}
          className="w-full bg-transparent text-sm outline-none placeholder:text-faint lg:text-[15px]"
        />
      </label>
      {error && (
        <span role="alert" className="text-[11px] text-miss">
          {error}
        </span>
      )}
    </form>
  );
}

/**
 * The day's routine: habits that come back on the same days every week. A habit is a tap, not a task: it never
 * asks "what got in the way?", and a day without it is only an empty dot.
 */
export function RoutineSection({ habits }: { habits: HabitView[] }) {
  const { openReminders, reminderTime } = useShell();
  const dueToday = habits.filter((h) => h.dueToday);
  const doneToday = dueToday.filter((h) => h.doneToday).length;
  // Today's first, then the ones with a day off; each group keeps the order it was created in.
  const ordered = [...habits].sort((a, b) => Number(b.dueToday) - Number(a.dueToday));

  if (habits.length === 0) {
    return (
      <section aria-labelledby="rotina-label" className="flex flex-col gap-1.5">
        <SectionLabel>
          <span id="rotina-label">Rotina</span>
        </SectionLabel>
        <div className="rounded-2xl border border-dashed border-dash-strong px-3.5 lg:px-4">
          <p className="pt-3.5 text-[13px] leading-relaxed text-muted">
            O que você faz todo dia leva às suas metas. Comece com um hábito pequeno.
          </p>
          <QuickAddHabit first />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="rotina-label">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <SectionLabel>
            <span id="rotina-label">Rotina</span>
          </SectionLabel>
          {dueToday.length > 0 && (
            <span
              className={cn(
                "text-[11px] transition-colors",
                doneToday === dueToday.length ? "text-ok-ink" : "text-muted",
              )}
            >
              {doneToday === dueToday.length ? "Em dia" : `${doneToday} de ${dueToday.length}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          <button type="button" onClick={openReminders} className="-my-2 rounded-lg px-2 py-2 hover:text-ink">
            {reminderTime ? `Lembrete · ${reminderTime}` : "Lembrete"}
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface px-3.5 lg:px-4">
        {ordered.map((h) => (
          <HabitRow key={h.id} habit={h} showGoal />
        ))}
        <QuickAddHabit first={false} />
      </div>
    </section>
  );
}

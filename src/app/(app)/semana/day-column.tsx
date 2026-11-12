"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useShell } from "@/components/shell";
import { Checkbox, cn } from "@/components/ui";
import { formatDayCaps, type LocalDate } from "@/lib/dates";
import type { TaskView } from "@/lib/views";
import { setTaskDone } from "@/server/actions/tasks";

/** A goal-linked task on the week board. The checkbox answers at once, like a task row does, and draws its tick. */
function MilestoneCard({ task: t }: { task: TaskView }) {
  const { openTaskEditor } = useShell();
  const [done, setDone] = useOptimistic(t.completed);
  const [, startTransition] = useTransition();
  const [ticked, setTicked] = useState(false);
  const toggle = () => {
    setTicked(!done);
    startTransition(async () => {
      setDone(!done);
      await setTaskDone(t.id, !done);
    });
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-2.5">
      <Checkbox
        size="sm"
        state={done ? "done" : t.missed ? "missed" : "open"}
        justDone={done && ticked}
        label={done ? `Desmarcar ${t.title}` : `Concluir ${t.title}`}
        onToggle={toggle}
      />
      <button type="button" onClick={() => openTaskEditor(t)} className="text-left">
        <span
          className={cn(
            "block text-xs leading-[1.3] transition-colors",
            done ? "text-muted line-through" : "font-semibold",
          )}
        >
          {t.title}
        </span>
        {!done && (
          <span className={cn("mt-1.5 block truncate text-[11px]", t.missed ? "text-miss" : "text-muted")}>
            {t.goalTitle}
          </span>
        )}
      </button>
    </div>
  );
}

/** One day of the desktop week board: goal-linked tasks as cards, loose tasks folded into one dashed card. */
export function DayColumn({ day, isToday, tasks }: { day: LocalDate; isToday: boolean; tasks: TaskView[] }) {
  const { openTaskEditor } = useShell();
  const milestones = tasks.filter((t) => t.goalId);
  const loose = tasks.filter((t) => !t.goalId);

  return (
    <div className="group flex min-w-0 flex-col gap-2">
      <div
        className={cn(
          "rounded-[10px] px-2.5 py-2 text-xs",
          isToday ? "bg-ink font-semibold text-on-ink" : "text-muted",
        )}
      >
        {formatDayCaps(day)}
      </div>
      {milestones.map((t) => (
        <MilestoneCard key={t.id} task={t} />
      ))}
      {loose.length > 0 && (
        <div className="rounded-xl border border-dashed border-line p-2.5 text-xs text-muted">
          {loose.map((t, i) => (
            <span key={t.id}>
              {i > 0 && " · "}
              <button
                type="button"
                onClick={() => openTaskEditor(t)}
                className={cn("hover:text-ink", t.completed && "line-through")}
              >
                {t.title}
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => openTaskEditor(undefined, { scheduledDate: day })}
        className="rounded-xl py-1.5 text-xs text-faint transition-colors hover:text-ink"
      >
        + Adicionar
      </button>
    </div>
  );
}

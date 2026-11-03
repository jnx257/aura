"use client";

import { useOptimistic, useTransition } from "react";
import { formatRelativeDay, weekdayShort } from "@/lib/dates";
import { REASON_LABEL, TIME_OF_DAY_LABEL } from "@/lib/labels";
import type { TaskView } from "@/lib/views";
import { setTaskDone } from "@/server/actions/tasks";
import { useShell } from "./shell";
import { Checkbox, cn, type CheckState } from "./ui";

/** Where the row is shown changes what its second line says. */
export type TaskRowContext = "today" | "week" | "goal";

function subtitle(task: TaskView, context: TaskRowContext, today: string): string | null {
  const parts: (string | null)[] = [];
  if (context === "goal") {
    parts.push(formatRelativeDay(task.scheduledDate, today));
    if (task.missed) parts.push(task.missed.reasonText ?? (task.missed.reason ? REASON_LABEL[task.missed.reason] : "não feita"));
    else if (task.completed && task.rescheduleCount > 0)
      parts.push(task.rescheduleCount === 1 ? "movida uma vez" : `movida ${task.rescheduleCount} vezes`);
    else if (!task.completed && task.timeOfDay) parts.push(TIME_OF_DAY_LABEL[task.timeOfDay]);
  } else {
    parts.push(task.goalTitle);
    if (task.missed) parts.push("não feita");
    else if (task.overdue && context === "today") parts.push(`desde ${weekdayShort(task.scheduledDate).toLowerCase()}`);
    if (context === "week" && task.timeOfDay) parts.push(TIME_OF_DAY_LABEL[task.timeOfDay]);
    if (task.deadline && !task.completed && !task.missed)
      parts.push(`prazo ${weekdayShort(task.deadline).toLowerCase()}`);
  }
  const text = parts.filter(Boolean).join(" · ");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null;
}

export function TaskRow({ task, context = "today" }: { task: TaskView; context?: TaskRowContext }) {
  const { today, openTaskEditor, openMissed } = useShell();
  const [done, setDone] = useOptimistic(task.completed);
  const [, startTransition] = useTransition();

  const state: CheckState = done ? "done" : task.missed ? "missed" : task.goalId ? "open" : "orphan";
  const sub = subtitle({ ...task, completed: done }, context, today);
  const toggle = () =>
    startTransition(async () => {
      setDone(!done);
      await setTaskDone(task.id, !done);
    });

  return (
    <div className="flex items-center gap-3 py-3 lg:gap-3.5 lg:py-[13px]">
      <Checkbox state={state} onToggle={toggle} label={done ? `Desmarcar ${task.title}` : `Concluir ${task.title}`} />
      <button type="button" onClick={() => openTaskEditor(task)} className="min-w-0 flex-1 text-left">
        <div
          className={cn(
            "truncate text-sm lg:text-[15px]",
            done ? "text-muted line-through" : task.goalId ? "font-medium" : "text-ink-soft",
            context === "goal" && "lg:text-sm",
          )}
        >
          {task.title}
        </div>
        {sub && (
          <div className={cn("mt-[3px] truncate text-[11px] lg:text-xs", task.missed && context !== "goal" ? "text-miss" : "text-muted", context === "goal" && "lg:text-[11px]")}>
            {sub}
          </div>
        )}
      </button>
      {task.missed && (
        <button
          type="button"
          onClick={() => openMissed(task.missed!)}
          className="flex-none text-[11px] font-semibold text-miss hover:underline lg:text-xs"
        >
          {context === "goal" ? "Responder" : "O que atrapalhou?"}
        </button>
      )}
    </div>
  );
}

export function TaskList({ tasks, context }: { tasks: TaskView[]; context?: TaskRowContext }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3.5 lg:px-4">
      {tasks.map((t, i) => (
        <div key={t.id} className={cn(i > 0 && "border-t border-divider")}>
          <TaskRow task={t} context={context} />
        </div>
      ))}
    </div>
  );
}

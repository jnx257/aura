"use client";

import { useShell } from "@/components/shell";
import type { GoalSummaryView } from "@/lib/views";

export function AddGoalButton({ first }: { first: boolean }) {
  const { openGoalEditor } = useShell();
  return (
    <button
      onClick={() => openGoalEditor()}
      className="rounded-2xl border border-dashed border-dash-strong p-3.5 text-center text-[13px] text-muted hover:text-ink lg:hidden"
    >
      {first ? "+ Crie sua primeira meta" : "+ Nova meta"}
    </button>
  );
}

export function EditGoalButton({ goal }: { goal: GoalSummaryView }) {
  const { openGoalEditor } = useShell();
  return (
    <button onClick={() => openGoalEditor(goal)} className="text-[13px] text-muted hover:text-ink">
      Editar
    </button>
  );
}

export function AddTaskToGoal({ goalId }: { goalId: string }) {
  const { openTaskEditor } = useShell();
  return (
    <button
      onClick={() => openTaskEditor(undefined, { goalId })}
      className="text-xs text-muted hover:text-ink"
    >
      + Tarefa
    </button>
  );
}

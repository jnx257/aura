"use client";

import { useShell } from "@/components/shell";

export function EmptyToday() {
  const { openTaskEditor } = useShell();
  return (
    <div className="rounded-2xl border border-dashed border-dash-strong px-5 py-8 text-center">
      <p className="text-sm text-muted">Nada planejado para hoje.</p>
      <button onClick={() => openTaskEditor()} className="mt-3 text-sm font-semibold underline underline-offset-[3px]">
        Adicionar uma tarefa
      </button>
    </div>
  );
}

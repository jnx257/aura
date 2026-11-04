"use client";

import { useShell } from "@/components/shell";
import type { LocalDate } from "@/lib/dates";

/** A day with nothing planned, on the phone's list of days: a place to start, not a blank. */
export function EmptyDay({ day }: { day: LocalDate }) {
  const { openTaskEditor } = useShell();
  return (
    <button
      type="button"
      onClick={() => openTaskEditor(undefined, { scheduledDate: day })}
      className="flex w-full items-center justify-between rounded-2xl border border-dashed border-dash-strong px-4 py-3.5 text-left text-[13px] text-muted transition-colors hover:text-ink"
    >
      <span>Nada planejado</span>
      <span className="font-semibold text-ink">+ Adicionar</span>
    </button>
  );
}

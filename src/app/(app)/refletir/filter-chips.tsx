"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { JournalFilter } from "./journal-list";

const FILTERS: { value: JournalFilter; label: string; href: string }[] = [
  { value: "all", label: "Todas", href: "/refletir" },
  { value: "goals", label: "Ligadas a metas", href: "/refletir?filtro=metas" },
  { value: "free", label: "Livres", href: "/refletir?filtro=livres" },
];

/**
 * The filter row above the list of reflections. Selecting a chip cross-fades its fill and label in place (see
 * .chip-fade); nothing slides. The tap is shown at once and the list catches up when the page does. A tap only counts
 * while the page it was made on is showing.
 */
export function FilterChips({ filter }: { filter: JournalFilter }) {
  const [pending, setPending] = useState<{ value: JournalFilter; from: JournalFilter } | null>(null);
  const shown = pending && pending.from === filter ? pending.value : filter;

  return (
    <nav className="flex gap-1.5" aria-label="Filtrar reflexões">
      {FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.href}
          onClick={() => setPending({ value: f.value, from: filter })}
          aria-current={shown === f.value ? "page" : undefined}
          className={cn(
            "chip-fade rounded-full border px-[13px] py-[7px] text-xs active:scale-[0.97] motion-reduce:active:scale-100 lg:px-3 lg:py-1.5",
            shown === f.value ? "border-ink bg-ink text-on-ink" : "border-line text-body hover:bg-sunken",
          )}
        >
          {f.label}
        </Link>
      ))}
    </nav>
  );
}

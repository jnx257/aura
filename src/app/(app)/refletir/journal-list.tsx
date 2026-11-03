import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDayCaps, type LocalDate } from "@/lib/dates";
import { MOOD_LABEL } from "@/lib/labels";
import type { JournalEntryView } from "@/lib/views";

export type JournalFilter = "all" | "goals" | "free";

const FILTERS: { value: JournalFilter; label: string; param: string }[] = [
  { value: "all", label: "Todas", param: "" },
  { value: "goals", label: "Ligadas a metas", param: "?filtro=metas" },
  { value: "free", label: "Livres", param: "?filtro=livres" },
];

export function parseFilter(raw: string | undefined): JournalFilter {
  return raw === "metas" ? "goals" : raw === "livres" ? "free" : "all";
}

export function JournalList({
  entries,
  filter,
  today,
  selectedId,
}: {
  entries: JournalEntryView[];
  filter: JournalFilter;
  today: LocalDate;
  selectedId?: string;
}) {
  return (
    <div className="flex flex-col gap-4 lg:gap-3.5">
      <nav className="flex gap-1.5" aria-label="Filtro">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/refletir${f.param}`}
            aria-current={filter === f.value ? "page" : undefined}
            className={cn(
              "rounded-full px-[13px] py-[7px] text-xs lg:px-3 lg:py-1.5",
              filter === f.value ? "bg-ink text-on-ink" : "border border-line text-body",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {entries.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          {filter === "all" ? "Nenhuma reflexão ainda." : "Nada por aqui."}
        </p>
      )}

      <ul className="flex flex-col">
        {entries.map((e, i) => {
          const selected = e.id === selectedId;
          const day = e.entryDate === today ? "HOJE" : formatDayCaps(e.entryDate);
          const tag = e.status === "draft" ? "RASCUNHO" : e.mood ? MOOD_LABEL[e.mood].toUpperCase() : null;
          return (
            <li key={e.id} className={cn(i > 0 && !selected && "border-t border-line")}>
              <Link
                href={`/refletir/escrever?id=${e.id}`}
                className={cn(
                  "flex flex-col gap-2 py-4 lg:gap-1.5 lg:rounded-xl lg:p-3.5",
                  selected && "lg:bg-surface",
                )}
              >
                <div className="flex justify-between text-[10px] tracking-[0.06em] text-muted lg:justify-start lg:gap-1">
                  <span>{day}</span>
                  {tag && (
                    <span>
                      <span className="hidden lg:inline">· </span>
                      {tag}
                    </span>
                  )}
                </div>
                <div className="text-[15px] font-medium lg:text-sm lg:font-semibold">{e.title || "Sem título"}</div>
                {e.excerpt && (
                  <p className="line-clamp-2 text-xs leading-[1.65] text-excerpt lg:line-clamp-1 lg:leading-relaxed">
                    {e.excerpt}
                  </p>
                )}
                {e.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {e.chips.map((c) => (
                      <span key={c} className="rounded-full bg-chip px-[9px] py-1 text-[11px] text-body lg:px-2 lg:py-[3px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Desktop: entries and writing side by side. Phone: one or the other. */
export function ReflectSplit({
  list,
  children,
  listOnMobile,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
  listOnMobile: boolean;
}) {
  return (
    <main className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[400px_minmax(0,1fr)]">
      <div
        className={cn(
          "px-5 pt-[22px] pb-28 lg:block lg:border-r lg:border-line lg:p-6",
          listOnMobile ? "block" : "hidden",
        )}
      >
        {list}
      </div>
      <div className={cn("relative lg:block", listOnMobile ? "hidden" : "block")}>{children}</div>
    </main>
  );
}

import { Pane, PaneLink } from "@/components/pane-swap";
import { cn } from "@/lib/cn";
import { formatDayCaps, type LocalDate } from "@/lib/dates";
import { MOOD_LABEL } from "@/lib/labels";
import type { JournalEntryView } from "@/lib/views";
import { FilterChips } from "./filter-chips";

export type JournalFilter = "all" | "goals" | "free";

/** What each filter shows, said once, when it is the one in use. */
const FILTER_HELP: Record<JournalFilter, string | null> = {
  all: null,
  goals: "Reflexões ligadas a uma meta, como as que nascem de uma tarefa perdida.",
  free: "Reflexões sem meta nem tarefa associada.",
};

const FILTER_EMPTY: Record<Exclude<JournalFilter, "all">, string> = {
  goals:
    "Nenhuma reflexão ligada a uma meta ainda. Ao refletir a partir de “O que atrapalhou?”, ela fica ligada à tarefa e à meta.",
  free: "Nenhuma reflexão sem vínculo ainda. As que você escreve direto aqui aparecem neste filtro.",
};

export function parseFilter(raw: string | undefined): JournalFilter {
  return raw === "metas" ? "goals" : raw === "livres" ? "free" : "all";
}

export function JournalList({
  entries,
  filter,
  today,
  selectedId,
  total = entries.length,
}: {
  entries: JournalEntryView[];
  filter: JournalFilter;
  today: LocalDate;
  selectedId?: string;
  /** How many reflections exist in all, so "none yet" can be told apart from "none in this filter". */
  total?: number;
}) {
  return (
    <div className="flex flex-col gap-4 lg:gap-3.5">
      <FilterChips filter={filter} />

      {FILTER_HELP[filter] && <p className="text-xs leading-relaxed text-muted">{FILTER_HELP[filter]}</p>}

      {entries.length === 0 && (
        <div className="flex flex-col gap-2 py-10 text-center text-sm leading-relaxed text-muted">
          {total === 0 ? (
            <>
              <p>Nenhuma reflexão ainda.</p>
              {/* On desktop the pane beside the list says this; on a phone the list is all there is. */}
              <p className="lg:hidden">
                Escreva sobre o seu dia. Quando uma tarefa de meta não sair, toque em “O que atrapalhou?” e
                depois em “Refletir sobre isso”: a reflexão já vem ligada à tarefa e à meta.
              </p>
            </>
          ) : (
            <p>{filter === "all" ? "Nenhuma reflexão para mostrar." : FILTER_EMPTY[filter]}</p>
          )}
        </div>
      )}

      {/* Keyed by the filter, so changing it fades the new list in rather than swapping it in one frame. */}
      <ul key={filter} className="flex animate-fade flex-col">
        {entries.map((e, i) => {
          const selected = e.id === selectedId;
          const day = e.entryDate === today ? "HOJE" : formatDayCaps(e.entryDate);
          const tag = e.status === "draft" ? "RASCUNHO" : e.mood ? MOOD_LABEL[e.mood].toUpperCase() : null;
          return (
            <li key={e.id} className={cn(i > 0 && !selected && "border-t border-line")}>
              <PaneLink
                direction="next"
                href={`/refletir/escrever?id=${e.id}`}
                className={cn(
                  "flex flex-col gap-2 py-4 lg:gap-1.5 lg:rounded-xl lg:p-3.5",
                  selected && "lg:bg-surface",
                )}
              >
                <div className="flex justify-between text-[11px] tracking-[0.06em] text-muted lg:justify-start lg:gap-1">
                  <span>{day}</span>
                  {tag && (
                    <span>
                      <span className="hidden lg:inline">· </span>
                      {tag}
                    </span>
                  )}
                </div>
                <div className="text-[15px] font-medium lg:text-sm lg:font-semibold">
                  {e.title || "Sem título"}
                </div>
                {e.excerpt && (
                  <p className="line-clamp-2 text-xs leading-[1.65] text-excerpt lg:line-clamp-1 lg:leading-relaxed">
                    {e.excerpt}
                  </p>
                )}
                {e.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {e.chips.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-chip px-[9px] py-1 text-[11px] text-body lg:px-2 lg:py-[3px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </PaneLink>
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
  floating,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
  listOnMobile: boolean;
  /** Fixed-position UI (the phone's "Escrever" button). Kept out of the columns, which are translated as they
      arrive: a fixed element inside a translated one would be placed against it and jump. */
  floating?: React.ReactNode;
}) {
  return (
    <main className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[400px_minmax(0,1fr)]">
      {/* Beside the editor the list is the same list as before, so on desktop it does not re-enter. */}
      <Pane
        desktop="none"
        className={cn(
          "px-5 pt-[22px] pb-28 lg:block lg:border-r lg:border-line lg:p-6",
          listOnMobile ? "block" : "hidden",
        )}
      >
        {list}
      </Pane>
      {/* On a phone this column can hold the writing screen's fixed mood bar, so it only fades in (globals.css). */}
      <Pane phone="fade" enter="fade" className={cn("relative lg:block", listOnMobile ? "hidden" : "block")}>
        {children}
      </Pane>
      {floating}
    </main>
  );
}

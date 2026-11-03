import { formatRelativeDay, type LocalDate } from "@/lib/dates";
import type { ActivityView } from "@/lib/views";
import { cn } from "@/lib/cn";
import { SectionLabel } from "./ui";

const KIND = {
  done: { label: "Feita", dot: "bg-ok" },
  missed: { label: "Perdida", dot: "bg-miss" },
  wrote: { label: "Escreveu", dot: "bg-ink" },
} as const;

/** Completions, misses and journal entries side by side, newest first. */
export function ActivityFeed({ items, today }: { items: ActivityView[]; today: LocalDate }) {
  if (items.length === 0) return null;
  return (
    <section className="px-1">
      <SectionLabel className="mb-1">Recente</SectionLabel>
      <ul>
        {items.map((item, i) => (
          <li
            key={`${item.kind}-${item.at}-${i}`}
            className={cn("flex items-baseline gap-2.5 py-[9px] text-[13px]", i > 0 && "border-t border-line")}
          >
            <span className={cn("size-[7px] flex-none rounded-full", KIND[item.kind].dot)} aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              <span className="text-muted">{KIND[item.kind].label}</span> {item.label}
            </span>
            <span className="text-[11px] text-muted">{formatRelativeDay(item.day, today)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

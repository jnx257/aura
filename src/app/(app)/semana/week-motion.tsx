"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { exitTiming } from "@/lib/motion";

type Direction = "next" | "prev";

/** Set on <html> by the week arrows for a moment, so the week that arrives knows which way you were going. */
const FLAG = "weekDir";

/**
 * Wraps whatever changes when the week does (the title, the days). Keyed by the week, it remounts on each change
 * and slides in from the side you moved towards. The direction is read once, when it mounts, so lifting the flag
 * later cannot restart the animation. On a first load or a link from elsewhere there is no direction and no motion.
 */
export function WeekSwap({ children, className }: { children: ReactNode; className?: string }) {
  const [direction] = useState<Direction | null>(() =>
    typeof document === "undefined" ? null : ((document.documentElement.dataset[FLAG] as Direction | undefined) ?? null),
  );
  return (
    <div
      data-week-swap
      className={cn(direction === "next" && "animate-week-next", direction === "prev" && "animate-week-prev", className)}
    >
      {children}
    </div>
  );
}

/**
 * The moment you press an arrow, the week you are leaving slides a little way out and dims, so the page answers at
 * once; the new week then slides in from the other side when it arrives. If the navigation never happens the old
 * week comes back, so nothing is left dimmed.
 */
function leave(direction: Direction) {
  const root = document.documentElement;
  root.dataset[FLAG] = direction;
  window.setTimeout(() => delete root.dataset[FLAG], 1500);
  // The same distance the arriving week travels (three steps of --enter-shift, which is 0 under reduced motion).
  const shift = `calc(var(--enter-shift) * ${direction === "next" ? -3 : 3})`;
  document.querySelectorAll<HTMLElement>("[data-week-swap]").forEach((el) => {
    const out = el.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0.25, translate: `${shift} 0` }], {
      ...exitTiming(),
      fill: "forwards",
    });
    window.setTimeout(() => el.isConnected && out.cancel(), 2500);
  });
}

const arrow = "rounded-lg px-2.5 py-1.5 transition-colors hover:bg-sunken";

export function WeekNav({
  previousHref,
  nextHref,
  currentHref,
  showCurrent,
  currentDirection,
}: {
  previousHref: string;
  nextHref: string;
  currentHref: string;
  /** "Esta semana" is only offered when you are looking at another week. */
  showCurrent: boolean;
  /** Which way "Esta semana" travels from here. */
  currentDirection: Direction;
}) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted" aria-label="Semanas">
      <Link href={previousHref} onClick={() => leave("prev")} className={arrow} aria-label="Semana anterior">
        ←
      </Link>
      {showCurrent && (
        <Link href={currentHref} onClick={() => leave(currentDirection)} className={arrow}>
          Esta semana
        </Link>
      )}
      <Link href={nextHref} onClick={() => leave("next")} className={arrow} aria-label="Próxima semana">
        →
      </Link>
    </nav>
  );
}

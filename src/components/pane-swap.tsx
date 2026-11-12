"use client";

import Link, { useLinkStatus } from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { exitTiming } from "@/lib/motion";

/**
 * Moving between the screens of one section (Metas -> a goal, Refletir -> a reflection). A tap on a `PaneLink` says
 * which way it is going ("next" goes deeper, "prev" comes back) and dims the pane that is leaving at once; the
 * `Pane`s that arrive read that direction once, when they mount, and come in from the matching side on a phone.
 * Without a direction (first load, browser back, a link from elsewhere) they get the page's ordinary entrance.
 *
 * Panes are the direct children of <main>, so the rules that style them live in globals.css next to the page
 * entrance they override (plain CSS beats Tailwind utilities, see HANDOFF.md).
 */
type Direction = "next" | "prev";

/** Set on <html> for a moment by a tap, so the panes that arrive know which way you were going. */
const FLAG = "paneDir";

/**
 * One column of a split screen. `phone` is how it arrives on a phone ("slide" from the side you went towards, or
 * "fade" for a pane that holds fixed-position UI, which a transform would displace), `desktop` how it arrives
 * beside the others ("fade", or "none" for a column that stays the same, like a list).
 */
export function Pane({
  children,
  className,
  phone = "slide",
  desktop = "fade",
  enter,
}: {
  children: ReactNode;
  className?: string;
  phone?: "slide" | "fade";
  desktop?: "fade" | "none";
  /** Keeps the page entrance of this column to a fade on phones, even with no direction (see globals.css). */
  enter?: "fade";
}) {
  const [direction] = useState<Direction | null>(() =>
    typeof document === "undefined" ? null : ((document.documentElement.dataset[FLAG] as Direction | undefined) ?? null),
  );
  return (
    <div
      data-pane={direction ?? undefined}
      data-pane-phone={phone}
      data-pane-desktop={desktop}
      data-enter={enter}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * The moment a link is tapped, the panes that are visible and about to be replaced dim a little (and, on a phone,
 * slide a little way out), so the screen answers at once while the next one renders on the server. If the
 * navigation never happens they come back, so nothing is left dimmed.
 */
export function leavePane(direction: Direction) {
  const root = document.documentElement;
  root.dataset[FLAG] = direction;
  window.setTimeout(() => {
    if (root.dataset[FLAG] === direction) delete root.dataset[FLAG];
  }, 1500);
  const desktop = window.matchMedia("(min-width: 1024px)").matches;
  // The same distance the arriving pane travels (three steps of --enter-shift, which is 0 under reduced motion).
  const shift = `calc(var(--enter-shift) * ${direction === "next" ? -3 : 3})`;
  document.querySelectorAll<HTMLElement>("[data-pane-phone]").forEach((el) => {
    if (el.offsetParent === null) return; // not on screen in this layout
    const mode = desktop ? el.dataset.paneDesktop : el.dataset.panePhone;
    if (mode === "none") return; // a column that stays put
    const frames =
      mode === "slide"
        ? [{ opacity: 1, translate: "0 0" }, { opacity: 0.25, translate: `${shift} 0` }]
        : [{ opacity: 1 }, { opacity: 0.25 }];
    const out = el.animate(frames, { ...exitTiming(), fill: "forwards" });
    window.setTimeout(() => el.isConnected && out.cancel(), 2500);
  });
}

/** A faint wash over a link while the page it leads to is still being rendered (it waits 100ms, so fast ones never flash). */
function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] bg-ink/5 opacity-0",
        pending && "animate-link-pending",
      )}
    />
  );
}

/** A link between the screens of a section: see `leavePane`. Plain clicks only; new-tab clicks are left alone. */
export function PaneLink({
  direction,
  onClick,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { direction: Direction }) {
  return (
    <Link
      {...props}
      className={cn("relative", className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        leavePane(direction);
      }}
    >
      {children}
      <LinkPending />
    </Link>
  );
}

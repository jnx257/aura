"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * A highlight that glides to whichever item is active (an ease-out that settles without bouncing), instead of
 * appearing on the new item and vanishing from the old one. Used by the Hoje/Semana/Metas tabs and the reflection filter chips.
 *
 * It is positioned by writing styles straight to the element (no React state), so selecting an item never costs a
 * render, and it starts in place: transitions are armed only after the first placement, so it does not slide in
 * from the corner on page load. Put `container` on the (positioned) wrapper, `item(key)` as the ref of every
 * item, and render {@link SlidingHighlight} inside the wrapper, behind the items.
 */
export function useSlidingHighlight(activeKey: string | null) {
  const container = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const items = useRef(new Map<string, HTMLElement>());

  const place = useCallback(() => {
    const box = highlight.current;
    if (!box) return;
    const el = activeKey ? items.current.get(activeKey) : undefined;
    if (!el) {
      box.style.opacity = "0";
      return;
    }
    box.style.opacity = "1";
    box.style.width = `${el.offsetWidth}px`;
    box.style.translate = `${el.offsetLeft}px 0`;
  }, [activeKey]);

  useLayoutEffect(place, [place]);

  // Arm the transition once the first placement has been painted.
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => highlight.current?.setAttribute("data-ready", ""));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  // Items change size too: the active one is bolder, fonts load, the window resizes.
  useEffect(() => {
    const wrapper = container.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(place);
    observer.observe(wrapper);
    items.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [place]);

  const item = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) items.current.set(key, el);
      else items.current.delete(key);
    },
    [],
  );

  return { container, highlight, item };
}

/** The moving box itself. Give it a shape with `className` (height, radius, colour, vertical position). */
export function SlidingHighlight({
  highlightRef,
  className,
}: {
  highlightRef: React.RefObject<HTMLSpanElement | null>;
  className?: string;
}) {
  return (
    <span
      ref={highlightRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-0 opacity-0",
        "data-ready:transition-[translate,width,opacity] data-ready:duration-(--dur-layout) data-ready:ease-(--ease-out)",
        "motion-reduce:transition-none",
        className,
      )}
    />
  );
}

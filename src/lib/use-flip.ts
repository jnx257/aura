import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion, timing } from "./motion";

/**
 * Makes a list glide instead of jump when its rows change places (FLIP: measure where each row was, let React move
 * it, then animate it from the old place to the new one). Put the returned ref on the list, which must be
 * positioned (`relative`), and `data-flip={id}` on each direct child. A row that is new to the list fades in.
 *
 * Positions are read with `offsetTop`, which ignores transforms, so a row that is still gliding is measured where it
 * belongs. Only `translate` and `opacity` are animated. Under reduced motion rows do not travel; new ones still fade.
 */
export function useFlip<T extends HTMLElement>() {
  const list = useRef<T>(null);
  const tops = useRef(new Map<string, number>());

  // Deliberately after every render of the list: a row can also move because a neighbour changed height.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-flip]"));
    const before = tops.current;
    const after = new Map(rows.map((row) => [row.dataset.flip!, row.offsetTop]));
    tops.current = after;
    if (before.size === 0) return; // first paint: nothing has moved yet

    const reduced = prefersReducedMotion();
    const up: HTMLElement[] = [];
    const down: HTMLElement[] = [];
    for (const row of rows) {
      const was = before.get(row.dataset.flip!);
      if (was === undefined) {
        row.animate([{ opacity: 0 }, { opacity: 1 }], timing("--dur-state", "--ease-out"));
        continue;
      }
      const delta = was - row.offsetTop;
      if (delta === 0 || reduced) continue;
      row.animate([{ translate: `0 ${delta}px` }, { translate: "0 0" }], timing("--dur-layout", "--ease-out"));
      (delta > 0 ? up : down).push(row);
    }
    // The row that was acted on goes against the others (it drops while they close up, or the reverse), and it
    // should pass over them, not under. When it is one against one, the one going down is the completed task.
    const over = up.length < down.length && up.length > 0 ? up : down;
    if (up.length > 0 && down.length > 0) {
      for (const row of over) {
        row.style.zIndex = "1";
        const settle = () => (row.style.zIndex = "");
        Promise.all(row.getAnimations().map((a) => a.finished)).then(settle, settle);
      }
    }
  });

  return list;
}

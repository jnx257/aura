"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

/** How long a press has to last to count as a hold. Long enough to be deliberate, short enough not to feel stuck. */
export const HOLD_MS = 450;

/** A hold may drift this far (px) before it is read as a scroll or a drag and cancelled. */
const SLOP = 10;

/**
 * Press-and-hold as a shortcut. Spread `props` on the element and set `data-holding={holding}` so the `.holdable`
 * styles can show the press charging. A tap (released before `ms`) behaves exactly as before; once the hold fires,
 * the click that follows is swallowed so the tap action never runs as well.
 *
 * Holding is only ever a shortcut: whatever it does must also be reachable with a plain tap or the keyboard.
 */
export function useLongPress(onLongPress: () => void, { ms = HOLD_MS, disabled = false } = {}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const callback = useRef(onLongPress);

  useEffect(() => {
    callback.current = onLongPress;
  });

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
    setHolding(false);
  }, []);

  useEffect(() => cancel, [cancel]);

  return {
    holding,
    props: {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
        fired.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        setHolding(true);
        timer.current = setTimeout(() => {
          timer.current = null;
          origin.current = null;
          fired.current = true;
          setHolding(false);
          navigator.vibrate?.(12); // a small tick where the platform allows it (Android)
          callback.current();
        }, ms);
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        const o = origin.current;
        if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > SLOP) cancel();
      },
      onPointerUp() {
        cancel();
        // The click that ends a hold arrives right after pointerup; once it has been swallowed, stop swallowing.
        if (fired.current) setTimeout(() => (fired.current = false), 60);
      },
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      // Android opens a context menu on a long press; keep it out of the way while a hold is in progress.
      onContextMenu(e: MouseEvent<HTMLElement>) {
        if (timer.current || fired.current) e.preventDefault();
      },
      onClickCapture(e: MouseEvent<HTMLElement>) {
        if (!fired.current) return;
        e.preventDefault();
        e.stopPropagation();
      },
    },
  };
}

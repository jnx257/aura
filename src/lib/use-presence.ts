import { useCallback, useState } from "react";

/**
 * Keeps something on screen for the moment it takes to leave. `mounted` stays true after `open` turns false, with
 * `closing` true, until whoever plays the exit calls `exited()` (from `animationend`, `transitionend` or a timer).
 * Whoever plays the exit must always call `exited()`, including when no animation runs, or the element stays mounted.
 */
export function usePresence(open: boolean) {
  const [present, setPresent] = useState(open);
  // Opening is known during render; closing only ends when the exit has played.
  if (open && !present) setPresent(true);
  const exited = useCallback(() => setPresent(false), []);
  return { mounted: open || present, closing: !open && present, exited };
}

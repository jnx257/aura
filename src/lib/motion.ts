/**
 * Motion tokens for scripted animations (the Web Animations API cannot read `var()`), read from globals.css so a
 * script and the stylesheet never drift apart. Call these from event handlers or effects, never during render.
 */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** A duration token in milliseconds. The build may rewrite `420ms` as `.42s`, so both units are read. */
function ms(name: string, fallback: number): number {
  const raw = token(name, "");
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith("ms") ? value : value * 1000;
}

const FALLBACK_MS = 220;
const FALLBACK_EASING = "ease-out";

/** A duration token and an easing token, as Web Animations options. */
export function timing(duration: `--dur-${string}`, easing: `--ease-${string}`): { duration: number; easing: string } {
  return { duration: ms(duration, FALLBACK_MS), easing: token(easing, FALLBACK_EASING) };
}

/** Timing for something that leaves: shorter than an arrival, and accelerating away. */
export function exitTiming(): { duration: number; easing: string } {
  return timing("--dur-exit", "--ease-in");
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

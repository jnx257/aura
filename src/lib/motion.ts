/**
 * Motion tokens for scripted animations (the Web Animations API cannot read `var()`), read from globals.css so a
 * script and the stylesheet never drift apart. Call these from event handlers or effects, never during render.
 */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function ms(name: string, fallback: number): number {
  const value = parseFloat(token(name, ""));
  return Number.isFinite(value) ? value : fallback;
}

/** Timing for something that leaves: shorter than an arrival, and accelerating away. */
export function exitTiming(): { duration: number; easing: string } {
  return { duration: ms("--dur-exit", 180), easing: token("--ease-in", "cubic-bezier(0.5, 0, 1, 1)") };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

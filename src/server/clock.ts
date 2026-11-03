import "server-only";

/** Current instant. In development, AURA_NOW freezes the clock to exercise time-based rules. */
export function now(): Date {
  const frozen = process.env.NODE_ENV !== "production" ? process.env.AURA_NOW : undefined;
  return frozen ? new Date(frozen) : new Date();
}

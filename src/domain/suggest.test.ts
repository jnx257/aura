import { describe, expect, it } from "vitest";
import { freshenSuggestion, suggestAdjustment } from "./suggest";

const MON = "2026-10-26";

describe("suggestAdjustment", () => {
  it("defaults to tomorrow, same period", () => {
    expect(suggestAdjustment(null, "evening", MON)).toEqual({ date: "2026-10-27", timeOfDay: "evening" });
    expect(suggestAdjustment("no_time", null, MON)).toEqual({ date: "2026-10-27", timeOfDay: null });
    expect(suggestAdjustment("lost_motivation", "afternoon", MON).date).toBe("2026-10-27");
    expect(suggestAdjustment("other", "afternoon", MON).date).toBe("2026-10-27");
  });

  it("too tired → tomorrow morning", () => {
    expect(suggestAdjustment("too_tired", "evening", MON)).toEqual({ date: "2026-10-27", timeOfDay: "morning" });
  });

  it("unexpected event → the coming Saturday", () => {
    expect(suggestAdjustment("unexpected", "morning", MON).date).toBe("2026-10-31");
    expect(suggestAdjustment("unexpected", "morning", "2026-10-30").date).toBe("2026-10-31"); // Fri
    expect(suggestAdjustment("unexpected", "morning", "2026-10-31").date).toBe("2026-11-07"); // Sat → next Sat
    expect(suggestAdjustment("unexpected", "morning", "2026-11-01").date).toBe("2026-11-07"); // Sun
  });

  it("recomputes a stale suggestion relative to today", () => {
    const stale = { date: "2026-10-20", timeOfDay: "morning" as const };
    expect(freshenSuggestion(stale, "too_tired", "evening", MON)).toEqual({
      date: "2026-10-27",
      timeOfDay: "morning",
    });
    const fresh = { date: "2026-10-31", timeOfDay: null };
    expect(freshenSuggestion(fresh, "unexpected", null, MON)).toBe(fresh);
  });
});

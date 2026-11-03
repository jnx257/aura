import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDayLong,
  formatRelativeDay,
  formatWeekRange,
  greeting,
  isValidLocalDate,
  localNow,
  startOfWeek,
  weekday,
} from "./dates";

describe("dates", () => {
  it("weeks start on Monday", () => {
    expect(weekday("2026-10-26")).toBe(0); // Monday
    expect(weekday("2026-11-01")).toBe(6); // Sunday
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26");
    expect(startOfWeek("2026-10-26")).toBe("2026-10-26");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("resolves the local day in the person's timezone, not UTC", () => {
    const instant = new Date("2026-10-27T01:30:00Z"); // 22:30 on the 26th in São Paulo
    expect(localNow("America/Sao_Paulo", instant)).toEqual({ date: "2026-10-26", minutes: 22 * 60 + 30 });
    expect(localNow("Asia/Tokyo", instant)).toEqual({ date: "2026-10-27", minutes: 10 * 60 + 30 });
  });

  it("formats in pt-BR like the design", () => {
    expect(formatDayLong("2026-10-26")).toBe("Seg, 26 out");
    expect(formatWeekRange("2026-10-28")).toBe("26 out – 1 nov");
    expect(formatRelativeDay("2026-10-24", "2026-10-26")).toBe("Sáb");
    expect(formatRelativeDay("2026-10-27", "2026-10-26")).toBe("Amanhã");
    expect(greeting(14 * 60)).toBe("Boa tarde");
  });

  it("validates local dates", () => {
    expect(isValidLocalDate("2026-02-29")).toBe(false);
    expect(isValidLocalDate("2028-02-29")).toBe(true);
    expect(isValidLocalDate("26/10/2026")).toBe(false);
  });
});

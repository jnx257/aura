import { describe, expect, it } from "vitest";
import { quickMoveOptions } from "./quickmove";

// 2026-11-02 is a Monday.
describe("quickMoveOptions", () => {
  it("offers tomorrow, the coming Saturday and the coming Monday", () => {
    const options = quickMoveOptions("2026-11-03", "2026-11-03"); // Tuesday
    expect(options.map((o) => [o.key, o.date])).toEqual([
      ["tomorrow", "2026-11-04"],
      ["saturday", "2026-11-07"],
      ["monday", "2026-11-09"],
    ]);
  });

  it("does not repeat a day: on a Friday tomorrow already is the Saturday", () => {
    const options = quickMoveOptions("2026-11-06", "2026-11-06"); // Friday
    expect(options.map((o) => [o.key, o.date])).toEqual([
      ["tomorrow", "2026-11-07"],
      ["monday", "2026-11-09"],
    ]);
  });

  it("on a Saturday the coming Saturday is next week's", () => {
    const options = quickMoveOptions("2026-11-07", "2026-11-07"); // Saturday
    expect(options.find((o) => o.key === "saturday")?.date).toBe("2026-11-14");
  });

  it("on a Sunday tomorrow is the Monday", () => {
    const options = quickMoveOptions("2026-11-08", "2026-11-08"); // Sunday
    expect(options.map((o) => o.key)).toEqual(["tomorrow", "saturday"]);
    expect(options[0].date).toBe("2026-11-09");
  });

  it("leaves out the day the task is already on", () => {
    const options = quickMoveOptions("2026-11-03", "2026-11-04");
    expect(options.map((o) => o.key)).toEqual(["saturday", "monday"]);
  });
});

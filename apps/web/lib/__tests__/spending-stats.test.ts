import { describe, it, expect } from "vitest";
import {
  dailyTotals,
  trailingMean,
  trailingMedian,
  runwayDays,
  daysOfData,
  localDayKey,
} from "@repo/shared/spending-stats";

const TZ = "Asia/Manila"; // UTC+8, no DST

/** Build a UTC timestamp for a Manila local date/time */
function manila(date: string, time = "12:00:00"): string {
  // Manila is UTC+8: local time minus 8h = UTC
  return new Date(`${date}T${time}+08:00`).toISOString();
}

const ANCHOR = manila("2026-07-08", "20:00:00"); // local evening on July 8

describe("dailyTotals", () => {
  it("zero-fills missing days across the full window", () => {
    const items = [
      { occurred_at: manila("2026-07-08"), amount: 300 },
      { occurred_at: manila("2026-07-06"), amount: 250 },
    ];
    const totals = dailyTotals(items, TZ, 7, ANCHOR);

    expect(totals).toHaveLength(7);
    expect(totals[0]!.date).toBe("2026-07-02");
    expect(totals[6]!).toEqual({ date: "2026-07-08", total: 300 });
    expect(totals[4]!).toEqual({ date: "2026-07-06", total: 250 });
    // All other days are zero
    expect(totals.filter((d) => d.total === 0)).toHaveLength(5);
  });

  it("sums multiple expenses on the same day", () => {
    const items = [
      { occurred_at: manila("2026-07-08", "08:00:00"), amount: 30 },
      { occurred_at: manila("2026-07-08", "12:30:00"), amount: 145 },
      { occurred_at: manila("2026-07-08", "18:00:00"), amount: 30 },
    ];
    const totals = dailyTotals(items, TZ, 7, ANCHOR);
    expect(totals[6]!.total).toBe(205);
  });

  it("respects timezone day boundaries (23:30 local counts as that local day)", () => {
    // 23:30 Manila on July 7 is 15:30 UTC July 7 — same UTC day here,
    // so also test the reverse: 07:30 Manila July 8 is 23:30 UTC July 7.
    const lateLocal = manila("2026-07-07", "23:30:00");
    const earlyLocal = manila("2026-07-08", "07:30:00"); // 2026-07-07T23:30Z

    expect(localDayKey(lateLocal, TZ)).toBe("2026-07-07");
    expect(localDayKey(earlyLocal, TZ)).toBe("2026-07-08");
    expect(new Date(earlyLocal).toISOString()).toContain("2026-07-07T23:30");

    const totals = dailyTotals(
      [
        { occurred_at: lateLocal, amount: 100 },
        { occurred_at: earlyLocal, amount: 50 },
      ],
      TZ,
      7,
      ANCHOR
    );
    expect(totals.find((d) => d.date === "2026-07-07")!.total).toBe(100);
    expect(totals.find((d) => d.date === "2026-07-08")!.total).toBe(50);
  });
});

describe("trailingMean", () => {
  it("computes mean over the full window including zero days", () => {
    const totals = [300, 0, 250, 400, 0, 350, 300].map((total, i) => ({
      date: `2026-07-0${i + 2}`,
      total,
    }));
    expect(trailingMean(totals)).toBeCloseTo(1600 / 7, 5);
  });

  it("returns 0 for an empty window", () => {
    expect(trailingMean([])).toBe(0);
  });
});

describe("trailingMedian", () => {
  it("resists a one-off spike", () => {
    const totals = [300, 280, 250, 3000, 320, 350, 300].map((total, i) => ({
      date: `2026-07-0${i + 2}`,
      total,
    }));
    expect(trailingMedian(totals)).toBe(300);
    expect(trailingMean(totals)).toBeGreaterThan(600);
  });

  it("averages middle values for even-length windows", () => {
    const totals = [100, 200, 300, 400].map((total, i) => ({
      date: `2026-07-0${i + 1}`,
      total,
    }));
    expect(trailingMedian(totals)).toBe(250);
  });
});

describe("runwayDays", () => {
  it("computes whole days from balance and burn rate", () => {
    expect(runwayDays(27000, 450)).toBe(60);
    expect(runwayDays(1000, 300)).toBe(3); // floors
  });

  it("returns null when there is no burn rate", () => {
    expect(runwayDays(27000, 0)).toBeNull();
    expect(runwayDays(27000, -5)).toBeNull();
  });

  it("returns 0 when the balance is depleted", () => {
    expect(runwayDays(0, 450)).toBe(0);
    expect(runwayDays(-200, 450)).toBe(0);
  });
});

describe("daysOfData", () => {
  it("counts inclusive days since first expense", () => {
    const items = [
      { occurred_at: manila("2026-07-06"), amount: 100 },
      { occurred_at: manila("2026-07-08"), amount: 100 },
    ];
    expect(daysOfData(items, TZ, ANCHOR)).toBe(3); // Jul 6, 7, 8
  });

  it("returns 0 with no data", () => {
    expect(daysOfData([], TZ, ANCHOR)).toBe(0);
  });

  it("returns 1 when the first expense is today", () => {
    const items = [{ occurred_at: manila("2026-07-08"), amount: 100 }];
    expect(daysOfData(items, TZ, ANCHOR)).toBe(1);
  });
});

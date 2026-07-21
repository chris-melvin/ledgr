import { describe, it, expect } from "vitest";
import {
  shiftDays,
  shiftMonths,
  expandScheduledEvents,
  forecastBalance,
  runwayDays,
  type ScheduledEventTemplate,
} from "@repo/shared/spending-stats";

const TZ = "Asia/Manila"; // UTC+8, no DST

/** Build a UTC timestamp for a Manila local date/time */
function manila(date: string, time = "12:00:00"): string {
  return new Date(`${date}T${time}+08:00`).toISOString();
}

describe("shiftDays / shiftMonths", () => {
  it("shifts whole calendar days regardless of runtime timezone", () => {
    expect(shiftDays("2026-07-19", 1)).toBe("2026-07-20");
    expect(shiftDays("2026-07-19", 30)).toBe("2026-08-18");
    expect(shiftDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("clamps month-end days instead of rolling over", () => {
    expect(shiftMonths("2026-01-31", 1)).toBe("2026-02-28"); // Feb has 28 days
    expect(shiftMonths("2024-01-31", 1)).toBe("2024-02-29"); // leap year
    expect(shiftMonths("2026-01-15", 1)).toBe("2026-02-15");
    expect(shiftMonths("2026-12-15", 1)).toBe("2027-01-15"); // year wrap
  });
});

describe("expandScheduledEvents", () => {
  const from = "2026-07-19";

  it("emits a one-off event only when it lands inside the window", () => {
    const inWindow: ScheduledEventTemplate[] = [
      { next_at: manila("2026-07-25"), amount: -8000, recurrence: "none" },
    ];
    expect(expandScheduledEvents(inWindow, TZ, from, 30)).toEqual([
      { date: "2026-07-25", amount: -8000 },
    ]);

    const beyond: ScheduledEventTemplate[] = [
      { next_at: manila("2026-09-01"), amount: -8000, recurrence: "none" },
    ];
    expect(expandScheduledEvents(beyond, TZ, from, 30)).toEqual([]);

    const past: ScheduledEventTemplate[] = [
      { next_at: manila("2026-07-10"), amount: -8000, recurrence: "none" },
    ];
    expect(expandScheduledEvents(past, TZ, from, 30)).toEqual([]);
  });

  it("expands a weekly event across the horizon", () => {
    const weekly: ScheduledEventTemplate[] = [
      { next_at: manila("2026-07-20"), amount: -500, recurrence: "weekly" },
    ];
    const events = expandScheduledEvents(weekly, TZ, from, 30);
    expect(events.map((e) => e.date)).toEqual([
      "2026-07-20",
      "2026-07-27",
      "2026-08-03",
      "2026-08-10",
      "2026-08-17",
    ]);
    expect(events.every((e) => e.amount === -500)).toBe(true);
  });

  it("rolls a lapsed monthly event forward to its next occurrence", () => {
    // next_at is in the past (the 5th); should surface Aug 5 (and later)
    const monthly: ScheduledEventTemplate[] = [
      { next_at: manila("2026-06-05"), amount: 30000, recurrence: "monthly" },
    ];
    const events = expandScheduledEvents(monthly, TZ, from, 60);
    expect(events.map((e) => e.date)).toEqual(["2026-08-05", "2026-09-05"]);
    expect(events[0]!.amount).toBe(30000);
  });

  it("ignores zero-amount templates", () => {
    const zero: ScheduledEventTemplate[] = [
      { next_at: manila("2026-07-25"), amount: 0, recurrence: "none" },
    ];
    expect(expandScheduledEvents(zero, TZ, from, 30)).toEqual([]);
  });
});

describe("forecastBalance", () => {
  const from = "2026-07-19";

  it("matches flat runwayDays when there are no events", () => {
    const r = forecastBalance({
      startingBalance: 1000,
      dailyBurn: 300,
      events: [],
      horizonDays: 365,
      fromDay: from,
    });
    expect(r.runway).toBe(runwayDays(1000, 300)); // 3
    expect(r.depletionDate).toBe(shiftDays(from, 4)); // day balance first < 0
    // Day 0 holds the starting balance
    expect(r.projection[0]).toEqual({ date: from, balance: 1000 });
  });

  it("returns runway 0 for an already-negative balance", () => {
    const r = forecastBalance({
      startingBalance: -200,
      dailyBurn: 300,
      events: [],
      horizonDays: 30,
      fromDay: from,
    });
    expect(r.runway).toBe(0);
    expect(r.depletionDate).toBe(from);
  });

  it("returns null runway when the balance never depletes in the horizon", () => {
    const r = forecastBalance({
      startingBalance: 100000,
      dailyBurn: 300,
      events: [],
      horizonDays: 30,
      fromDay: from,
    });
    expect(r.runway).toBeNull();
    expect(r.depletionDate).toBeNull();
  });

  it("depletes earlier when a bill lands before the flat run-out", () => {
    const flat = forecastBalance({
      startingBalance: 5000,
      dailyBurn: 300,
      events: [],
      horizonDays: 60,
      fromDay: from,
    });
    const withBill = forecastBalance({
      startingBalance: 5000,
      dailyBurn: 300,
      events: [{ date: shiftDays(from, 5), amount: -4000 }],
      horizonDays: 60,
      fromDay: from,
    });
    expect(withBill.runway!).toBeLessThan(flat.runway!);
  });

  it("extends runway when income arrives before depletion", () => {
    const withIncome = forecastBalance({
      startingBalance: 1000,
      dailyBurn: 300,
      events: [{ date: shiftDays(from, 2), amount: 5000 }],
      horizonDays: 60,
      fromDay: from,
    });
    // Without income runway is 3 days; the top-up pushes depletion out.
    expect(withIncome.runway!).toBeGreaterThan(3);
  });
});

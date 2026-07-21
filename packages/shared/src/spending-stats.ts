/**
 * Spending Statistics Utilities (spending-clarity)
 *
 * Pure functions for trailing daily-spend averages and runway.
 * Design rules (see openspec/changes/spending-clarity/design.md D5):
 * - Windows are trailing N *calendar days* in the user's timezone,
 *   ending on (and including) the anchor day.
 * - Days with no qualifying expenses count as zero-spend days.
 * - Only expenses whose bucket is flagged `include_in_daily_avg`
 *   should be passed in — filtering is the caller's job.
 *
 * Shared between web and (later) mobile.
 *
 * @module @repo/shared/spending-stats
 */

import { formatInTimeZone } from "date-fns-tz";
import { parseISO, subDays } from "date-fns";
import { DEFAULT_TIMEZONE } from "./date";

const DAY_KEY_FORMAT = "yyyy-MM-dd";

export interface SpendItem {
  /** UTC TIMESTAMPTZ string */
  occurred_at: string;
  amount: number;
}

export interface DailyTotal {
  /** Local calendar day, yyyy-MM-dd in the user's timezone */
  date: string;
  total: number;
}

/**
 * Local calendar-day key (yyyy-MM-dd) for a UTC timestamp in the user's timezone.
 */
export function localDayKey(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(parseISO(timestamp), timezone, DAY_KEY_FORMAT);
}

/**
 * Per-day totals for the trailing `windowDays` calendar days ending on the
 * anchor timestamp's local day (inclusive). Missing days are zero-filled.
 */
export function dailyTotals(
  items: SpendItem[],
  timezone: string,
  windowDays: number,
  anchorTimestamp: string
): DailyTotal[] {
  const totalsByDay = new Map<string, number>();
  for (const item of items) {
    const key = localDayKey(item.occurred_at, timezone);
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + item.amount);
  }

  const anchor = parseISO(anchorTimestamp);
  const days: DailyTotal[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const key = formatInTimeZone(subDays(anchor, i), timezone, DAY_KEY_FORMAT);
    days.push({ date: key, total: totalsByDay.get(key) ?? 0 });
  }
  return days;
}

/**
 * Mean of daily totals across the full window (zero days included).
 */
export function trailingMean(totals: DailyTotal[]): number {
  if (totals.length === 0) return 0;
  const sum = totals.reduce((acc, d) => acc + d.total, 0);
  return sum / totals.length;
}

/**
 * Median of daily totals across the full window (zero days included).
 */
export function trailingMedian(totals: DailyTotal[]): number {
  if (totals.length === 0) return 0;
  const sorted = totals.map((d) => d.total).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/**
 * Whole days the balance lasts at the given mean daily spend.
 * Returns null when there is no meaningful burn rate (zero/negative mean),
 * so callers render a placeholder instead of infinity.
 */
export function runwayDays(
  balance: number,
  meanDailySpend: number
): number | null {
  if (meanDailySpend <= 0) return null;
  if (balance <= 0) return 0;
  return Math.floor(balance / meanDailySpend);
}

/**
 * Number of local calendar days elapsed (inclusive) since the first item,
 * up to the anchor day. Used for the "collecting — N of 7 days" state.
 * Returns 0 when there are no items.
 */
export function daysOfData(
  items: SpendItem[],
  timezone: string,
  anchorTimestamp: string
): number {
  if (items.length === 0) return 0;
  let firstKey: string | null = null;
  for (const item of items) {
    const key = localDayKey(item.occurred_at, timezone);
    if (firstKey === null || key < firstKey) firstKey = key;
  }
  const anchorKey = localDayKey(anchorTimestamp, timezone);
  if (firstKey === null || firstKey > anchorKey) return 0;

  // Count inclusive days between the two local day keys
  const first = parseISO(`${firstKey}T00:00:00Z`);
  const anchor = parseISO(`${anchorKey}T00:00:00Z`);
  const diffDays = Math.round(
    (anchor.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)
  );
  return diffDays + 1;
}

// ─── Calendar-aware runway forecast (runway-forecast) ───────────────────────
//
// The flat `runwayDays` above answers "at my average burn, how long does the
// balance last?" but ignores lumpy bills and any money coming in. The forecast
// below walks the balance forward day by day, applying a smoothed daily burn
// plus discrete dated events (scheduled bills going out, income/top-ups coming
// in), so it can report an actual run-out DATE rather than a flat day count.

export type ScheduledRecurrence = "none" | "weekly" | "biweekly" | "monthly";

/**
 * A recurrence template the forecast expands into concrete dated occurrences.
 * `amount` is SIGNED: inflows positive, outflows negative.
 */
export interface ScheduledEventTemplate {
  /** UTC TIMESTAMPTZ of the next (or a representative) occurrence */
  next_at: string;
  /** Signed: + inflow, − outflow */
  amount: number;
  recurrence: ScheduledRecurrence;
}

/** A single dated money event on the forecast timeline. */
export interface ForecastEvent {
  /** Local calendar day, yyyy-MM-dd */
  date: string;
  /** Signed: + inflow, − outflow */
  amount: number;
}

export interface BalanceForecastPoint {
  /** Local calendar day, yyyy-MM-dd */
  date: string;
  balance: number;
}

export interface BalanceForecast {
  /** Day 0 = `fromDay` at `startingBalance`, then one point per horizon day. */
  projection: BalanceForecastPoint[];
  /** First day the projected balance goes below zero, or null within horizon. */
  depletionDate: string | null;
  /** Whole days the balance lasts (floor-equivalent); null if it never depletes. */
  runway: number | null;
}

const GUARD_LIMIT = 800; // ~2 years of weekly steps — a runaway backstop

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Parse a yyyy-MM-dd day key to a UTC-midnight Date (runtime-timezone safe). */
function dayKeyToUtc(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function utcToDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Shift a day key by whole calendar days. */
export function shiftDays(dayKey: string, days: number): string {
  const d = dayKeyToUtc(dayKey);
  d.setUTCDate(d.getUTCDate() + days);
  return utcToDayKey(d);
}

/**
 * Shift a day key by whole months, clamping the day to the target month's
 * length (Jan 31 + 1 month → Feb 28/29) rather than JS's default rollover.
 */
export function shiftMonths(dayKey: string, months: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const monthIndex = m! - 1 + months;
  const targetY = y! + Math.floor(monthIndex / 12);
  const targetM = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
  const day = Math.min(d!, lastDay);
  return utcToDayKey(new Date(Date.UTC(targetY, targetM, day)));
}

/**
 * Expand recurrence templates into concrete dated events within the window
 * [fromDay, fromDay + horizonDays]. Recurring templates whose next occurrence
 * has already lapsed are rolled forward to their first upcoming slot; one-off
 * templates are emitted only if they land inside the window.
 */
export function expandScheduledEvents(
  templates: ScheduledEventTemplate[],
  timezone: string,
  fromDay: string,
  horizonDays: number
): ForecastEvent[] {
  const endDay = shiftDays(fromDay, horizonDays);
  const out: ForecastEvent[] = [];

  for (const t of templates) {
    if (!t.amount) continue;
    let day = localDayKey(t.next_at, timezone);

    if (t.recurrence === "none") {
      if (day >= fromDay && day <= endDay) out.push({ date: day, amount: t.amount });
      continue;
    }

    const stepDays =
      t.recurrence === "weekly" ? 7 : t.recurrence === "biweekly" ? 14 : 0;
    const advance = (from: string): string =>
      stepDays > 0 ? shiftDays(from, stepDays) : shiftMonths(from, 1);

    let guard = 0;
    while (day < fromDay && guard < GUARD_LIMIT) {
      day = advance(day);
      guard++;
    }
    guard = 0;
    while (day <= endDay && guard < GUARD_LIMIT) {
      out.push({ date: day, amount: t.amount });
      day = advance(day);
      guard++;
    }
  }

  return out;
}

/**
 * Project the running balance forward from `fromDay`, subtracting `dailyBurn`
 * each day and applying signed `events` on their dates. Reports the projected
 * daily balances, the first day it goes negative, and a whole-day runway that
 * matches `runwayDays` in the flat (no-events) case.
 */
export function forecastBalance(params: {
  startingBalance: number;
  dailyBurn: number;
  events: ForecastEvent[];
  horizonDays: number;
  fromDay: string;
}): BalanceForecast {
  const { startingBalance, dailyBurn, events, horizonDays, fromDay } = params;

  const eventsByDay = new Map<string, number>();
  for (const e of events) {
    eventsByDay.set(e.date, (eventsByDay.get(e.date) ?? 0) + e.amount);
  }

  const projection: BalanceForecastPoint[] = [
    { date: fromDay, balance: round2(startingBalance) },
  ];
  let balance = startingBalance;
  let depletionIndex: number | null = balance < 0 ? 0 : null;

  for (let i = 1; i <= horizonDays; i++) {
    const day = shiftDays(fromDay, i);
    balance = balance - dailyBurn + (eventsByDay.get(day) ?? 0);
    projection.push({ date: day, balance: round2(balance) });
    if (depletionIndex === null && balance < 0) depletionIndex = i;
  }

  const depletionDate =
    depletionIndex === null ? null : projection[depletionIndex]!.date;
  const runway = depletionIndex === null ? null : Math.max(0, depletionIndex - 1);

  return { projection, depletionDate, runway };
}

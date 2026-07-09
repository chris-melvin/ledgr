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

"use server";

import {
  ledgerEventRepository,
  budgetBucketRepository,
  settingsRepository,
  scheduledEventRepository,
} from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { LedgerEvent, ScheduledEvent } from "@repo/database";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";
import {
  dailyTotals,
  trailingMean,
  trailingMedian,
  daysOfData,
  expandScheduledEvents,
  forecastBalance,
  localDayKey,
  type SpendItem,
  type ScheduledEventTemplate,
} from "@repo/shared/spending-stats";
import { subDays } from "date-fns";

const COLLECTING_THRESHOLD_DAYS = 7;
/** How far ahead the runway forecast projects (caps the reported runway). */
const FORECAST_HORIZON_DAYS = 365;

export interface SpendingStats {
  balance: number;
  hasOpeningBalance: boolean;
  todayTotal: number;
  mean7: number;
  median7: number;
  mean30: number;
  median30: number;
  /** Whole days the balance lasts at the forecast burn rate; null when no rate */
  runway: number | null;
  /** Projected day the balance first goes negative (yyyy-MM-dd), or null */
  depletionDate: string | null;
  /** Forward balance projection (excludes today) for the balance-trend chart */
  forecastPoints: { date: string; balance: number }[];
  /** Inclusive days since the first qualifying expense (0 = no data) */
  daysOfData: number;
  /** True while fewer than 7 days of data exist */
  collecting: boolean;
}

/** How many days of the forward projection to surface on the chart. */
const FORECAST_DISPLAY_DAYS = 30;

/**
 * Running balance + trailing spend statistics for the tracking hero.
 * Only expenses in avg-flagged buckets (or with no bucket — the Daily
 * fallback) feed the averages; ledger events never do.
 */
export async function getSpendingStats(): Promise<ActionResult<SpendingStats>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const settings = await settingsRepository
      .get(supabase, userId)
      .catch(() => null);
    const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;
    const anchor = new Date().toISOString();

    const openingBalance = await ledgerEventRepository.findOpeningBalance(
      supabase,
      userId
    );

    // 31-day fetch window buffers timezone offset around the 30-day stat
    // window. Never look past the opening balance: expenses before the
    // snapshot are history, not part of this tracking era.
    const thirtyOneDaysAgo = subDays(new Date(), 31).toISOString();
    const windowStart =
      openingBalance && openingBalance.occurred_at > thirtyOneDaysAgo
        ? openingBalance.occurred_at
        : thirtyOneDaysAgo;

    const [balance, buckets, expenseResult, scheduledEvents] = await Promise.all([
      ledgerEventRepository.getRunningBalance(supabase, userId),
      budgetBucketRepository.findAllOrdered(supabase, userId),
      supabase
        .from("expenses")
        .select("amount, occurred_at, bucket_id")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gt("occurred_at", windowStart)
        .lte("occurred_at", anchor),
      // Resilient: forecast still works (Phase-1 estimate) if the table is
      // not migrated yet — a missing table degrades to "no scheduled events".
      scheduledEventRepository
        .findActive(supabase, userId)
        .catch(() => [] as ScheduledEvent[]),
    ]);

    if (expenseResult.error) throw expenseResult.error;

    const avgBucketIds = new Set(
      buckets.filter((b) => b.include_in_daily_avg).map((b) => b.id)
    );
    const allExpenses = (expenseResult.data ?? []) as {
      amount: number;
      occurred_at: string;
      bucket_id: string | null;
    }[];
    const qualifying: SpendItem[] = allExpenses
      .filter((e) => e.bucket_id === null || avgBucketIds.has(e.bucket_id))
      .map((e) => ({ occurred_at: e.occurred_at, amount: Number(e.amount) }));

    const totals30 = dailyTotals(qualifying, timezone, 30, anchor);
    const totals7 = totals30.slice(-7);
    const mean30 = trailingMean(totals30);
    const mean7 = trailingMean(totals7);
    const dataDays = daysOfData(qualifying, timezone, anchor);

    // Discretionary burn prefers the 30d mean; falls back to 7d while filling
    const discretionaryBurn = dataDays >= 30 ? mean30 : mean7;

    // Bills / non-daily expenses are excluded from the discretionary average
    // but still drain the balance. Smooth the trailing 30d of them into a daily
    // drag so runway reflects real total outflow — unless the user has itemised
    // upcoming bills as scheduled events, in which case we trust those explicit
    // events and drop the estimate to avoid double-counting.
    const billItems: SpendItem[] = allExpenses
      .filter((e) => e.bucket_id !== null && !avgBucketIds.has(e.bucket_id))
      .map((e) => ({ occurred_at: e.occurred_at, amount: Number(e.amount) }));
    const billsDailyDrag = trailingMean(
      dailyTotals(billItems, timezone, 30, anchor)
    );

    // Scheduled events → signed forecast templates
    const templates: ScheduledEventTemplate[] = scheduledEvents.map((ev) => ({
      next_at: ev.next_at,
      amount:
        ev.direction === "inflow" ? Number(ev.amount) : -Number(ev.amount),
      recurrence: ev.recurrence,
    }));
    const hasScheduledOutflow = templates.some((t) => t.amount < 0);
    const dailyBurn =
      discretionaryBurn + (hasScheduledOutflow ? 0 : billsDailyDrag);

    const fromDay = localDayKey(anchor, timezone);
    const forecast = forecastBalance({
      startingBalance: balance,
      dailyBurn,
      events: expandScheduledEvents(
        templates,
        timezone,
        fromDay,
        FORECAST_HORIZON_DAYS
      ),
      horizonDays: FORECAST_HORIZON_DAYS,
      fromDay,
    });

    // Forward projection for the chart: run to a little past depletion (so the
    // zero-crossing is visible) or a short flat tail when it doesn't deplete.
    const displayDays = forecast.depletionDate
      ? Math.min((forecast.runway ?? 0) + 6, FORECAST_DISPLAY_DAYS)
      : 14;
    const forecastPoints = forecast.projection.slice(1, displayDays + 1);

    return success({
      balance,
      hasOpeningBalance: openingBalance !== null,
      todayTotal: totals30[totals30.length - 1]?.total ?? 0,
      mean7,
      median7: trailingMedian(totals7),
      mean30,
      median30: trailingMedian(totals30),
      runway: forecast.runway,
      depletionDate: forecast.depletionDate,
      forecastPoints,
      daysOfData: dataDays,
      collecting: dataDays < COLLECTING_THRESHOLD_DAYS,
    });
  } catch (err) {
    console.error("Failed to compute spending stats:", err);
    return error("Failed to compute spending stats", "DATABASE_ERROR");
  }
}

/**
 * Ledger events in a time range (for history views), newest first.
 */
export async function getLedgerEvents(
  startTimestamp: string,
  endTimestamp: string
): Promise<ActionResult<LedgerEvent[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const events = await ledgerEventRepository.findInRange(
      supabase,
      userId,
      startTimestamp,
      endTimestamp
    );
    return success(events);
  } catch (err) {
    console.error("Failed to fetch ledger events:", err);
    return error("Failed to fetch ledger events", "DATABASE_ERROR");
  }
}

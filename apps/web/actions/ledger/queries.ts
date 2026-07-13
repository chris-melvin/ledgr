"use server";

import {
  ledgerEventRepository,
  budgetBucketRepository,
  settingsRepository,
} from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { LedgerEvent } from "@repo/database";
import { DEFAULT_TIMEZONE } from "@/lib/utils/date";
import {
  dailyTotals,
  trailingMean,
  trailingMedian,
  runwayDays,
  daysOfData,
  type SpendItem,
} from "@repo/shared/spending-stats";
import { subDays } from "date-fns";

const COLLECTING_THRESHOLD_DAYS = 7;

export interface SpendingStats {
  balance: number;
  hasOpeningBalance: boolean;
  todayTotal: number;
  mean7: number;
  median7: number;
  mean30: number;
  median30: number;
  /** Whole days the balance lasts at the current burn rate; null when no rate */
  runway: number | null;
  /** Inclusive days since the first qualifying expense (0 = no data) */
  daysOfData: number;
  /** True while fewer than 7 days of data exist */
  collecting: boolean;
}

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

    const [balance, buckets, expenseResult] = await Promise.all([
      ledgerEventRepository.getRunningBalance(supabase, userId),
      budgetBucketRepository.findAllOrdered(supabase, userId),
      supabase
        .from("expenses")
        .select("amount, occurred_at, bucket_id")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gt("occurred_at", windowStart)
        .lte("occurred_at", anchor),
    ]);

    if (expenseResult.error) throw expenseResult.error;

    const avgBucketIds = new Set(
      buckets.filter((b) => b.include_in_daily_avg).map((b) => b.id)
    );
    const qualifying: SpendItem[] = (
      (expenseResult.data ?? []) as {
        amount: number;
        occurred_at: string;
        bucket_id: string | null;
      }[]
    )
      .filter(
        (e) => e.bucket_id === null || avgBucketIds.has(e.bucket_id)
      )
      .map((e) => ({ occurred_at: e.occurred_at, amount: Number(e.amount) }));

    const totals30 = dailyTotals(qualifying, timezone, 30, anchor);
    const totals7 = totals30.slice(-7);
    const mean30 = trailingMean(totals30);
    const mean7 = trailingMean(totals7);
    const dataDays = daysOfData(qualifying, timezone, anchor);

    // Runway prefers the 30d mean; falls back to 7d while the window fills
    const burnRate = dataDays >= 30 ? mean30 : mean7;

    return success({
      balance,
      hasOpeningBalance: openingBalance !== null,
      todayTotal: totals30[totals30.length - 1]?.total ?? 0,
      mean7,
      median7: trailingMedian(totals7),
      mean30,
      median30: trailingMedian(totals30),
      runway: runwayDays(balance, burnRate),
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

"use client";

import { useState, useMemo } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import {
  computeDailySpending,
  computeCategoryBreakdown,
  computeDayOfWeekSpending,
  computeStreaks,
  computePeriodTotals,
  computeMonthComparison,
  computeRollingAverage,
  computeWeekdayWeekendSplit,
  computeTrackingCompleteness,
  computeTrackingCalendar,
  computeTimeOfDay,
  computeCumulativeSpending,
  computeTopSpendingDays,
  computeCategoryTrends,
  computeBalanceTrend,
  computeBucketBreakdown,
} from "@/lib/insights/calculations";
import { SpendingTrendChart } from "./spending-trend-chart";
import { CategoryBreakdown } from "./category-breakdown";
import { DayOfWeekHeatmap } from "./day-of-week-heatmap";
import { StreakCard } from "./streak-card";
import { MonthComparisonCard } from "./month-comparison";
import { WeekdayWeekendSplitCard } from "./weekday-weekend-split";
import { TrackingCompletenessCard } from "./tracking-completeness";
import { TrackingCalendar } from "./tracking-calendar";
import { TimeOfDayChart } from "./time-of-day-chart";
import { CumulativeSpendingChart } from "./cumulative-spending-chart";
import { TopSpendingDays } from "./top-spending-days";
import { CategoryTrends } from "./category-trends";
import { BalanceTrendChart } from "./balance-trend-chart";
import { BucketBreakdown } from "./bucket-breakdown";
import type { BudgetBucket, Expense, LedgerEvent } from "@repo/database";
import type { InsightsPeriod } from "@/lib/insights/types";

interface InsightsTabProps {
  expenses: Expense[];
  dailyLimit: number;
  isBudgetMode: boolean;
  // Tracking-mode extras (spending-clarity)
  ledgerEvents?: LedgerEvent[];
  buckets?: BudgetBucket[];
  currentBalance?: number | null;
}

export function InsightsTab({
  expenses,
  dailyLimit,
  isBudgetMode,
  ledgerEvents = [],
  buckets = [],
  currentBalance = null,
}: InsightsTabProps) {
  const { timezone } = useTimezone();
  const [period, setPeriod] = useState<InsightsPeriod>("month");

  const days = period === "week" ? 7 : 30;

  // Filter expenses to the selected period
  const periodExpenses = useMemo(() => {
    const endTimestamp = dateUtils.getCurrentTimestamp(timezone, true);
    const startTimestamp = dateUtils.subtractDaysFromTimestamp(
      endTimestamp,
      days - 1,
      timezone
    );
    const startDate = dateUtils.formatInTimezone(
      new Date(startTimestamp),
      timezone,
      "yyyy-MM-dd"
    );

    return expenses.filter((e) => {
      const key = dateUtils.formatInTimezone(
        new Date(e.occurred_at),
        timezone,
        "yyyy-MM-dd"
      );
      return key >= startDate;
    });
  }, [expenses, timezone, days]);

  const dailySpending = useMemo(() => {
    const data = computeDailySpending(expenses, timezone, days);
    if (isBudgetMode) {
      return data.map((d) => ({ ...d, overBudget: d.amount > dailyLimit }));
    }
    return data;
  }, [expenses, timezone, days, isBudgetMode, dailyLimit]);

  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(periodExpenses),
    [periodExpenses]
  );

  const dayOfWeek = useMemo(
    () => computeDayOfWeekSpending(periodExpenses, timezone),
    [periodExpenses, timezone]
  );

  const streak = useMemo(
    () => computeStreaks(expenses, timezone, dailyLimit, isBudgetMode),
    [expenses, timezone, dailyLimit, isBudgetMode]
  );

  const totals = useMemo(
    () => computePeriodTotals(periodExpenses, period, timezone, days),
    [periodExpenses, period, timezone, days]
  );

  const monthComparison = useMemo(
    () => computeMonthComparison(expenses, timezone),
    [expenses, timezone]
  );

  const rollingAverage = useMemo(
    () => computeRollingAverage(dailySpending),
    [dailySpending]
  );

  const weekdayWeekendSplit = useMemo(
    () => computeWeekdayWeekendSplit(periodExpenses, timezone),
    [periodExpenses, timezone]
  );

  const trackingCompleteness = useMemo(
    () => computeTrackingCompleteness(periodExpenses, timezone, days),
    [periodExpenses, timezone, days]
  );

  const trackingCalendar = useMemo(
    () => computeTrackingCalendar(expenses, timezone),
    [expenses, timezone]
  );

  const timeOfDay = useMemo(
    () => computeTimeOfDay(periodExpenses, timezone),
    [periodExpenses, timezone]
  );

  const cumulativeSpending = useMemo(
    () => computeCumulativeSpending(expenses, timezone),
    [expenses, timezone]
  );

  const topSpendingDays = useMemo(
    () => computeTopSpendingDays(periodExpenses, timezone),
    [periodExpenses, timezone]
  );

  const categoryTrends = useMemo(
    () => computeCategoryTrends(expenses, timezone),
    [expenses, timezone]
  );

  // Tracking-mode: balance trend + bucket breakdown (spending-clarity)
  const openingEvent = useMemo(
    () => ledgerEvents.find((ev) => ev.type === "opening_balance") ?? null,
    [ledgerEvents]
  );

  const balanceTrend = useMemo(() => {
    if (isBudgetMode || currentBalance === null) return [];
    return computeBalanceTrend(
      currentBalance,
      ledgerEvents,
      expenses,
      timezone,
      days,
      openingEvent?.occurred_at ?? null
    );
  }, [isBudgetMode, currentBalance, ledgerEvents, expenses, timezone, days, openingEvent]);

  const bucketBreakdown = useMemo(() => {
    if (isBudgetMode || buckets.length === 0) return [];
    // Only post-opening expenses belong to the tracking era
    const eraExpenses = openingEvent
      ? periodExpenses.filter((e) => e.occurred_at > openingEvent.occurred_at)
      : periodExpenses;
    return computeBucketBreakdown(eraExpenses, buckets);
  }, [isBudgetMode, buckets, periodExpenses, openingEvent]);

  return (
    <div className="max-w-lg mx-auto p-3 sm:p-4 space-y-4">
      {/* 1. Period Toggle + Summary */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
        <div className="p-4">
          {/* Period Toggle */}
          <div className="flex items-center justify-center mb-3">
            <div className="inline-flex bg-neutral-100 rounded-full p-0.5">
              <button
                onClick={() => setPeriod("week")}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                  period === "week"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod("month")}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                  period === "month"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Month
              </button>
            </div>
          </div>
          {/* Summary */}
          <div className="text-center">
            <p className="text-xs text-neutral-500">
              {totals.periodLabel}: {formatCurrency(totals.total, CURRENCY)}{" "}
              spent
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {formatCurrency(totals.avg, CURRENCY)}/day avg
            </p>
          </div>
        </div>
      </div>

      {/* 2. Balance Trend (tracking mode) */}
      <BalanceTrendChart data={balanceTrend} />

      {/* 2b. Tracking Completeness Score (NEW) */}
      <TrackingCompletenessCard data={trackingCompleteness} />

      {/* 3. Month-over-Month Comparison */}
      <MonthComparisonCard comparison={monthComparison} />

      {/* 4. Spending Trend Chart */}
      <SpendingTrendChart
        data={dailySpending}
        rollingAverage={rollingAverage}
        dailyLimit={dailyLimit}
        isBudgetMode={isBudgetMode}
      />

      {/* 4b. Bucket Breakdown (tracking mode) */}
      <BucketBreakdown data={bucketBreakdown} />

      {/* 5. Cumulative Spending Chart (NEW) */}
      <CumulativeSpendingChart data={cumulativeSpending} />

      {/* 6. Weekend vs Weekday Split */}
      <WeekdayWeekendSplitCard data={weekdayWeekendSplit} />

      {/* 7. Time-of-Day Distribution (NEW) */}
      <TimeOfDayChart data={timeOfDay} />

      {/* 8. Category Breakdown */}
      <CategoryBreakdown categories={categoryBreakdown} />

      {/* 9. Top Spending Days (NEW) */}
      <TopSpendingDays data={topSpendingDays} />

      {/* 10. Category Trends Over Time (NEW) */}
      <CategoryTrends data={categoryTrends} />

      {/* 11. Day of Week Heatmap */}
      <DayOfWeekHeatmap
        data={dayOfWeek}
        dailyLimit={dailyLimit}
        isBudgetMode={isBudgetMode}
      />

      {/* 12. Streak Card */}
      <StreakCard streak={streak} />

      {/* 13. Tracking Consistency Calendar (NEW) */}
      <TrackingCalendar data={trackingCalendar} />
    </div>
  );
}

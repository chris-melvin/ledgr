import { useCallback, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/components/providers/auth-provider";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { ExpenseDao, type LocalExpense } from "@/lib/db/expense-dao";
import {
  computeDailySpending,
  computeCategoryBreakdown,
  computeStreaks,
  computePeriodTotals,
  computeMonthComparison,
  computeWeekdayWeekendSplit,
  computeTrackingCompleteness,
  computeTopSpendingDays,
  computeTimeOfDay,
} from "@repo/shared/insights";
import type {
  DailySpending,
  CategoryTotal,
  StreakInfo,
  PeriodTotals,
  MonthComparison,
  WeekdayWeekendSplit,
  TrackingCompleteness,
  TopSpendingDay,
  TimeOfDayBucket,
  InsightsPeriod,
} from "@repo/shared/insights/types";

export function useInsightsData(period: InsightsPeriod = "month") {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const timezone = useTimezone();
  const { settings } = useSettingsContext();
  const dao = useMemo(() => new ExpenseDao(db), [db]);

  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const results = await dao.findAll(user.id);
    setExpenses(results);
    setIsLoading(false);
  }, [dao, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const days = period === "week" ? 7 : 30;
  const dailyLimit = settings.calculated_daily_limit ?? settings.default_daily_limit;
  const isBudgetMode = settings.tracking_mode === "budget_enabled";

  // Compute all insights from expenses
  const dailySpending: DailySpending[] = useMemo(
    () => computeDailySpending(expenses, timezone, days),
    [expenses, timezone, days]
  );

  const categoryBreakdown: CategoryTotal[] = useMemo(
    () => computeCategoryBreakdown(expenses),
    [expenses]
  );

  const streaks: StreakInfo = useMemo(
    () => computeStreaks(expenses, timezone, dailyLimit, isBudgetMode),
    [expenses, timezone, dailyLimit, isBudgetMode]
  );

  const periodTotals: PeriodTotals = useMemo(
    () => computePeriodTotals(expenses, period, timezone, days),
    [expenses, period, timezone, days]
  );

  const monthComparison: MonthComparison | null = useMemo(
    () => computeMonthComparison(expenses, timezone),
    [expenses, timezone]
  );

  const weekdayWeekend: WeekdayWeekendSplit = useMemo(
    () => computeWeekdayWeekendSplit(expenses, timezone),
    [expenses, timezone]
  );

  const completeness: TrackingCompleteness = useMemo(
    () => computeTrackingCompleteness(expenses, timezone, days),
    [expenses, timezone, days]
  );

  const topDays: TopSpendingDay[] = useMemo(
    () => computeTopSpendingDays(expenses, timezone),
    [expenses, timezone]
  );

  const timeOfDay: TimeOfDayBucket[] = useMemo(
    () => computeTimeOfDay(expenses, timezone),
    [expenses, timezone]
  );

  return {
    isLoading,
    refresh,
    dailySpending,
    categoryBreakdown,
    streaks,
    periodTotals,
    monthComparison,
    weekdayWeekend,
    completeness,
    topDays,
    timeOfDay,
  };
}

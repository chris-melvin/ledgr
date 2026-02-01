/**
 * Budget Progress Calculations
 *
 * Pure functions for calculating daily rollover, weekly progress,
 * monthly progress, and generating positive messaging.
 */

import { format } from "date-fns";
import type {
  DailyBudgetStatus,
  WeeklyProgress,
  MonthlyProgress,
  TodayStatus,
  PositiveMessage,
} from "./types";

/**
 * Get the start of the week for a given date
 * Week starts on Monday by default
 */
export function getWeekStart(date: Date, weekStartsOn = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the week for a given date
 */
export function getWeekEnd(date: Date, weekStartsOn = 1): Date {
  const start = getWeekStart(date, weekStartsOn);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Calculate daily rollover for a date range
 *
 * Rollover accumulates from under-budget days and carries forward.
 * Over-budget days consume rollover first before going negative.
 */
export function calculateDailyRollover(
  dailyTotals: Map<string, number>,
  dailyLimit: number,
  startDate: Date,
  endDate: Date
): DailyBudgetStatus[] {
  const result: DailyBudgetStatus[] = [];
  let accumulatedRollover = 0;

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = formatDateKey(current);
    const spent = dailyTotals.get(dateKey) ?? 0;
    const remaining = dailyLimit - spent;

    const status: DailyBudgetStatus = {
      date: dateKey,
      limit: dailyLimit,
      spent,
      remaining,
      rollover: accumulatedRollover,
      effectiveLimit: dailyLimit + accumulatedRollover,
    };

    result.push(status);

    // Update rollover for next day
    // If under budget, add savings to rollover
    // If over budget, rollover absorbs the overage (minimum 0)
    if (remaining > 0) {
      accumulatedRollover += remaining;
    } else {
      accumulatedRollover = Math.max(0, accumulatedRollover + remaining);
    }

    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Calculate weekly progress
 */
export function calculateWeeklyProgress(
  dailyTotals: Map<string, number>,
  dailyLimit: number,
  referenceDate: Date = new Date(),
  weekStartsOn = 1
): WeeklyProgress {
  const weekStart = getWeekStart(referenceDate, weekStartsOn);
  const weekEnd = getWeekEnd(referenceDate, weekStartsOn);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Only calculate up to today (not future days)
  const effectiveEnd = weekEnd <= today ? weekEnd : today;

  const dailyBreakdown = calculateDailyRollover(
    dailyTotals,
    dailyLimit,
    weekStart,
    effectiveEnd
  );

  const daysTracked = dailyBreakdown.length;
  const totalBudget = daysTracked * dailyLimit;
  const totalSpent = dailyBreakdown.reduce((sum, d) => sum + d.spent, 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    weekStart: formatDateKey(weekStart),
    weekEnd: formatDateKey(weekEnd),
    totalBudget,
    totalSpent,
    remaining,
    percentUsed,
    daysTracked,
    dailyBreakdown,
  };
}

/**
 * Calculate monthly progress
 */
export function calculateMonthlyProgress(
  dailyTotals: Map<string, number>,
  dailyLimit: number,
  year: number,
  month: number // 0-indexed
): MonthlyProgress {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const totalDays = monthEnd.getDate();
  const effectiveEnd = monthEnd <= today ? monthEnd : today;

  // Calculate days elapsed (including today if within month)
  const daysElapsed =
    effectiveEnd >= monthStart
      ? Math.min(
          Math.floor(
            (effectiveEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1,
          totalDays
        )
      : 0;

  const dailyBreakdown = calculateDailyRollover(
    dailyTotals,
    dailyLimit,
    monthStart,
    effectiveEnd
  );

  const totalBudget = totalDays * dailyLimit;
  const totalSpent = dailyBreakdown.reduce((sum, d) => sum + d.spent, 0);
  const expectedSpentToDate = daysElapsed * dailyLimit;
  const aheadBehindAmount = expectedSpentToDate - totalSpent;

  // Project end of month spending at current daily rate
  const avgDailySpending =
    daysElapsed > 0 ? totalSpent / daysElapsed : dailyLimit;
  const projectedEndOfMonth = avgDailySpending * totalDays;

  // Calculate accumulated rollover
  const lastDay = dailyBreakdown.at(-1);
  const rolloverAccumulated = lastDay ? lastDay.rollover : 0;

  return {
    monthStart: formatDateKey(monthStart),
    monthEnd: formatDateKey(monthEnd),
    totalBudget,
    totalSpent,
    expectedSpentToDate,
    aheadBehindAmount,
    projectedEndOfMonth,
    rolloverAccumulated,
    daysElapsed,
    totalDays,
  };
}

/**
 * Calculate today's status
 */
export function calculateTodayStatus(
  dailyTotals: Map<string, number>,
  dailyLimit: number,
  today: Date = new Date()
): TodayStatus {
  const todayKey = formatDateKey(today);
  const spent = dailyTotals.get(todayKey) ?? 0;
  const remaining = dailyLimit - spent;

  // Get rollover from yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate rollover by looking at month start to yesterday
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const dailyBreakdown = calculateDailyRollover(
    dailyTotals,
    dailyLimit,
    monthStart,
    yesterday
  );

  const yesterdayStatus = dailyBreakdown.at(-1);
  const rolloverFromYesterday = yesterdayStatus
    ? yesterdayStatus.rollover + (yesterdayStatus.remaining > 0 ? yesterdayStatus.remaining : 0)
    : 0;

  return {
    date: todayKey,
    dailyLimit,
    spent,
    remaining,
    rolloverFromYesterday,
    effectiveLimit: dailyLimit + rolloverFromYesterday,
    isOver: remaining < 0,
    savedToday: remaining > 0 ? remaining : 0,
  };
}

/**
 * Generate positive message based on budget status
 */
export function getPositiveMessage(
  todayStatus: TodayStatus,
  weeklyProgress: WeeklyProgress,
  monthlyProgress: MonthlyProgress
): PositiveMessage | null {
  // Monthly ahead is most impactful
  if (monthlyProgress.aheadBehindAmount > 0) {
    return {
      type: "monthly_ahead",
      message: `You're ahead this month!`,
      amount: monthlyProgress.aheadBehindAmount,
    };
  }

  // Weekly ahead
  if (weeklyProgress.remaining > 0 && weeklyProgress.daysTracked >= 3) {
    return {
      type: "weekly_ahead",
      message: `Great week so far!`,
      amount: weeklyProgress.remaining,
    };
  }

  // Under budget today
  if (todayStatus.savedToday > 0) {
    return {
      type: "under_budget",
      message: `You saved today!`,
      amount: todayStatus.savedToday,
    };
  }

  // Rollover growing
  if (todayStatus.rolloverFromYesterday > 0) {
    return {
      type: "rollover_growing",
      message: `Extra flexibility available`,
      amount: todayStatus.rolloverFromYesterday,
    };
  }

  return null;
}

/**
 * Count consecutive under-budget days (streak)
 */
export function getUnderBudgetStreak(
  dailyBreakdown: DailyBudgetStatus[]
): number {
  let streak = 0;
  // Count from most recent day backwards
  for (let i = dailyBreakdown.length - 1; i >= 0; i--) {
    const day = dailyBreakdown[i];
    if (day && day.remaining >= 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

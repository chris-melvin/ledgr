"use client";

import { useMemo } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import type { HeatmapCell, DateRange } from "@/lib/types";

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Minimal expense interface for heatmap calculations
interface ExpenseForHeatmap {
  occurred_at: string;
  amount: number;
}

interface UseSpendingHeatmapProps {
  expenses: ExpenseForHeatmap[];
  dateRange: DateRange;
}

/**
 * Hook for generating spending heatmap data with timezone support
 *
 * Groups expenses by date in user's timezone for accurate daily aggregation
 */
export function useSpendingHeatmap({
  expenses,
  dateRange,
}: UseSpendingHeatmapProps): HeatmapCell[] {
  const { timezone } = useTimezone();

  return useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Create a map of date -> { amount, count }
    const dateMap = new Map<string, { amount: number; count: number }>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = dateUtils.formatInTimezone(currentDate, timezone, "yyyy-MM-dd");
      dateMap.set(dateKey, { amount: 0, count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate expenses by date in user's timezone
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.occurred_at);
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const dateKey = dateUtils.formatInTimezone(expenseDate, timezone, "yyyy-MM-dd");
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.amount += expense.amount;
          existing.count += 1;
        }
      }
    });

    // Convert to HeatmapCell array
    const cells: HeatmapCell[] = [];
    dateMap.forEach((data, dateKey) => {
      const date = dateUtils.parseInTimezone(dateKey, timezone, "yyyy-MM-dd");
      cells.push({
        date: dateKey,
        dayOfWeek: date.getDay(),
        week: getWeekNumber(date),
        amount: data.amount,
        count: data.count,
      });
    });

    // Sort by date
    cells.sort((a, b) => a.date.localeCompare(b.date));

    return cells;
  }, [expenses, dateRange, timezone]);
}

"use client";

import { useMemo } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { DEFAULT_DAILY_LIMIT } from "@/lib/constants";
import type { Expense } from "@repo/database";

interface UseCalendarOptions {
  dailyLimit?: number;
}

/**
 * Hook for calendar-related calculations with timezone support
 *
 * Updated to use timestamps and timezone-aware date comparisons
 */
export function useCalendar(
  expenses: Expense[],
  options: UseCalendarOptions = {}
) {
  const { timezone } = useTimezone();
  const { dailyLimit = DEFAULT_DAILY_LIMIT } = options;

  const todayStatus = useMemo(() => {
    const today = new Date();
    const todayDateStr = dateUtils.formatInTimezone(today, timezone, "yyyy-MM-dd");

    const todayExpenses = expenses.filter((e) => {
      const expenseDateStr = dateUtils.formatInTimezone(new Date(e.occurred_at), timezone, "yyyy-MM-dd");
      return expenseDateStr === todayDateStr;
    });

    const spent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = dailyLimit - spent;

    return {
      spent,
      remaining,
      limit: dailyLimit,
      isOver: remaining < 0,
    };
  }, [expenses, dailyLimit, timezone]);

  return {
    todayStatus,
  };
}

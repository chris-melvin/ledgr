"use client";

import { useState, useMemo, useCallback } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import type { TimeframeOption, DateRange } from "@/lib/types";

interface UseTimeframeReturn {
  timeframe: TimeframeOption;
  setTimeframe: (timeframe: TimeframeOption) => void;
  dateRange: DateRange;
  setCustomRange: (range: DateRange) => void;
  label: string;
}

// Get date range for a timeframe with timezone support
function getDateRangeForTimeframe(timeframe: TimeframeOption, timezone: string): DateRange {
  const now = new Date();
  const today = dateUtils.startOfDayInTimezone(now, timezone);

  switch (timeframe) {
    case "daily": {
      const start = dateUtils.startOfDayInTimezone(today, timezone);
      const end = dateUtils.endOfDayInTimezone(today, timezone);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }
    case "weekly": {
      const weekStart = dateUtils.startOfWeekInTimezone(today, timezone);
      const dayEnd = dateUtils.endOfDayInTimezone(today, timezone);
      return {
        start: weekStart.toISOString(),
        end: dayEnd.toISOString(),
      };
    }
    case "monthly": {
      const monthStart = dateUtils.startOfMonthInTimezone(today, timezone);
      const dayEnd = dateUtils.endOfDayInTimezone(today, timezone);
      return {
        start: monthStart.toISOString(),
        end: dayEnd.toISOString(),
      };
    }
    case "yearly": {
      const yearStart = dateUtils.startOfYearInTimezone(today, timezone);
      const dayEnd = dateUtils.endOfDayInTimezone(today, timezone);
      return {
        start: yearStart.toISOString(),
        end: dayEnd.toISOString(),
      };
    }
    case "all":
    default: {
      // Last 2 years by default for "all"
      const twoYearsAgo = dateUtils.addYearsToDate(today, -2, timezone);
      const start = dateUtils.startOfDayInTimezone(twoYearsAgo, timezone);
      const dayEnd = dateUtils.endOfDayInTimezone(today, timezone);
      return {
        start: start.toISOString(),
        end: dayEnd.toISOString(),
      };
    }
  }
}

// Get label for timeframe with timezone support
function getTimeframeLabel(timeframe: TimeframeOption, dateRange: DateRange, timezone: string): string {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  switch (timeframe) {
    case "daily":
      return dateUtils.formatDate(dateRange.end, timezone, dateUtils.DATE_FORMATS.WEEKDAY_LONG);
    case "weekly":
      return `Week of ${dateUtils.formatDate(dateRange.start, timezone, dateUtils.DATE_FORMATS.SHORT)}`;
    case "monthly":
      return dateUtils.formatDate(dateRange.start, timezone, dateUtils.DATE_FORMATS.MONTH_YEAR);
    case "yearly":
      return dateUtils.toUserDate(dateRange.start, timezone).getFullYear().toString();
    case "all":
      return "All Time";
    default:
      return "";
  }
}

export function useTimeframe(
  initialTimeframe: TimeframeOption = "monthly"
): UseTimeframeReturn {
  const { timezone } = useTimezone();
  const [timeframe, setTimeframeState] = useState<TimeframeOption>(initialTimeframe);
  const [customRange, setCustomRangeState] = useState<DateRange | null>(null);

  // Calculate date range based on timeframe or custom range
  const dateRange = useMemo(() => {
    if (customRange) return customRange;
    return getDateRangeForTimeframe(timeframe, timezone);
  }, [timeframe, customRange, timezone]);

  // Label for display
  const label = useMemo(() => {
    return getTimeframeLabel(timeframe, dateRange, timezone);
  }, [timeframe, dateRange, timezone]);

  // Set timeframe and clear custom range
  const setTimeframe = useCallback((newTimeframe: TimeframeOption) => {
    setTimeframeState(newTimeframe);
    setCustomRangeState(null);
  }, []);

  // Set custom date range
  const setCustomRange = useCallback((range: DateRange) => {
    setCustomRangeState(range);
  }, []);

  return {
    timeframe,
    setTimeframe,
    dateRange,
    setCustomRange,
    label,
  };
}

/**
 * Utility to filter data by timestamp range
 *
 * @param data - Array of items with timestamp field (occurred_at, created_at, etc.)
 * @param dateRange - Date range with ISO 8601 timestamps
 * @param timestampField - Name of the timestamp field to filter on (defaults to 'occurred_at')
 */
export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  dateRange: DateRange,
  timestampField: keyof T = 'occurred_at' as keyof T
): T[] {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  return data.filter((item) => {
    const timestamp = item[timestampField];
    if (!timestamp) return false;

    const itemDate = new Date(timestamp);
    return itemDate >= start && itemDate <= end;
  });
}

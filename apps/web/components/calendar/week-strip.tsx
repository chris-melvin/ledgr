"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { formatInTimezone, startOfWeekInTimezone } from "@/lib/utils/date";
import type { Expense } from "@repo/database";

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  expenses: Expense[];
  dailyLimit: number;
  timezone: string;
  onTodayPress: () => void;
  /** Tracking mode: shade day dots by spend intensity instead of limit status */
  showIntensity?: boolean;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function getSpendingDotColor(spent: number, limit: number, isFuture: boolean): string {
  if (isFuture || spent === 0) return "bg-neutral-200";
  const pct = (spent / limit) * 100;
  if (pct > 100) return "bg-rose-400";
  if (pct >= 80) return "bg-amber-400";
  return "bg-emerald-400";
}

export function WeekStrip({
  selectedDate,
  onSelectDate,
  expenses,
  dailyLimit,
  timezone,
  onTodayPress,
  showIntensity = false,
}: WeekStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(
    () => formatInTimezone(today, timezone, "yyyy-MM-dd"),
    [today, timezone]
  );
  const selectedKey = useMemo(
    () => formatInTimezone(selectedDate, timezone, "yyyy-MM-dd"),
    [selectedDate, timezone]
  );

  // Compute the 7 days of the current offset week
  const weekDays = useMemo(() => {
    const baseWeekStart = startOfWeekInTimezone(today, timezone, 0); // Sunday
    const offsetStart = addDays(baseWeekStart, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(offsetStart, i));
  }, [today, timezone, weekOffset]);

  // Spending per day (keyed by yyyy-MM-dd)
  const spendingByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const key = formatInTimezone(new Date(exp.occurred_at), timezone, "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + exp.amount);
    }
    return map;
  }, [expenses, timezone]);

  // Month/year label — handles cross-month weeks
  const monthLabel = useMemo(() => {
    const first = weekDays[0]!;
    const last = weekDays[6]!;
    const firstMonth = formatInTimezone(first, timezone, "MMM");
    const lastMonth = formatInTimezone(last, timezone, "MMM");
    const firstYear = formatInTimezone(first, timezone, "yyyy");
    const lastYear = formatInTimezone(last, timezone, "yyyy");

    if (firstYear !== lastYear) {
      return `${firstMonth} ${firstYear} – ${lastMonth} ${lastYear}`;
    }
    if (firstMonth !== lastMonth) {
      return `${firstMonth} – ${lastMonth} ${firstYear}`;
    }
    return `${firstMonth} ${firstYear}`;
  }, [weekDays, timezone]);

  // Max spend across the visible week — anchors intensity shading
  const weekMaxSpend = useMemo(() => {
    if (!showIntensity) return 0;
    return weekDays.reduce((max, day) => {
      const key = formatInTimezone(day, timezone, "yyyy-MM-dd");
      return Math.max(max, spendingByDay.get(key) ?? 0);
    }, 0);
  }, [showIntensity, weekDays, spendingByDay, timezone]);

  const goToPrevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goToNextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);
  const goToToday = useCallback(() => {
    setWeekOffset(0);
    onTodayPress();
  }, [onTodayPress]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 p-3">
      {/* Top row: month label + nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrevWeek}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-700">{monthLabel}</span>
          {weekOffset !== 0 && (
            <button
              onClick={goToToday}
              className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full hover:bg-teal-100 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, i) => {
          const dayKey = formatInTimezone(day, timezone, "yyyy-MM-dd");
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedKey;
          const isFuture = dayKey > todayKey;
          const spent = spendingByDay.get(dayKey) ?? 0;
          const dayNum = formatInTimezone(day, timezone, "d");

          return (
            <button
              key={dayKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all",
                isSelected
                  ? "bg-neutral-900 text-white"
                  : isToday
                    ? "bg-teal-50 text-teal-700"
                    : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase",
                  isSelected ? "text-neutral-400" : isToday ? "text-teal-500" : "text-neutral-400"
                )}
              >
                {WEEKDAY_LETTERS[i]}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isSelected ? "text-white" : isToday ? "text-teal-700" : "text-neutral-700"
                )}
              >
                {dayNum}
              </span>
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full mt-0.5",
                  isSelected
                    ? spent > 0
                      ? "bg-white/60"
                      : "bg-neutral-600"
                    : showIntensity
                      ? spent === 0 || isFuture
                        ? "bg-neutral-200"
                        : ""
                      : getSpendingDotColor(spent, dailyLimit, isFuture)
                )}
                style={
                  showIntensity && !isSelected && !isFuture && spent > 0 && weekMaxSpend > 0
                    ? {
                        backgroundColor: `rgba(59, 130, 246, ${(
                          0.3 + 0.7 * Math.min(1, spent / weekMaxSpend)
                        ).toFixed(2)})`,
                      }
                    : undefined
                }
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

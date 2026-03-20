import { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  getStartOfWeek,
  addDaysToTimestamp,
  toDateString,
  formatDate,
  getTodayTimestamp,
} from "@repo/shared/date";
import { useSettingsContext } from "@/components/providers/settings-provider";
import type { LocalExpense } from "@/lib/db/expense-dao";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function getSpendingDotColor(spent: number, limit: number, isFuture: boolean): string {
  if (isFuture || spent === 0) return "bg-neutral-200";
  const pct = (spent / limit) * 100;
  if (pct > 100) return "bg-rose-400";
  if (pct >= 80) return "bg-amber-400";
  return "bg-emerald-400";
}

interface WeekStripProps {
  selectedDate: string;
  timezone: string;
  onSelectDate: (dateTimestamp: string) => void;
  expenses: LocalExpense[];
  dailyLimit: number;
  onTodayPress: () => void;
}

export function WeekStrip({
  selectedDate,
  timezone,
  onSelectDate,
  expenses,
  dailyLimit,
  onTodayPress,
}: WeekStripProps) {
  const { settings } = useSettingsContext();
  const [weekOffset, setWeekOffset] = useState(0);

  const today = useMemo(() => getTodayTimestamp(timezone), [timezone]);
  const todayKey = useMemo(() => toDateString(today, timezone), [today, timezone]);
  const selectedKey = useMemo(() => toDateString(selectedDate, timezone), [selectedDate, timezone]);

  const weekDays = useMemo(() => {
    const baseWeekStart = getStartOfWeek(today, timezone, settings.week_starts_on);
    const offsetStart = addDaysToTimestamp(baseWeekStart, weekOffset * 7, timezone);
    return Array.from({ length: 7 }, (_, i) =>
      addDaysToTimestamp(offsetStart, i, timezone)
    );
  }, [today, timezone, weekOffset, settings.week_starts_on]);

  // Spending per day
  const spendingByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const key = toDateString(exp.occurred_at, timezone);
      map.set(key, (map.get(key) ?? 0) + exp.amount);
    }
    return map;
  }, [expenses, timezone]);

  // Month/year label
  const monthLabel = useMemo(() => {
    const first = weekDays[0]!;
    const last = weekDays[6]!;
    const firstMonth = formatDate(first, timezone, "MMM");
    const lastMonth = formatDate(last, timezone, "MMM");
    const firstYear = formatDate(first, timezone, "yyyy");
    const lastYear = formatDate(last, timezone, "yyyy");

    if (firstYear !== lastYear) {
      return `${firstMonth} ${firstYear} – ${lastMonth} ${lastYear}`;
    }
    if (firstMonth !== lastMonth) {
      return `${firstMonth} – ${lastMonth} ${firstYear}`;
    }
    return `${firstMonth} ${firstYear}`;
  }, [weekDays, timezone]);

  const goToPrevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goToNextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);
  const goToToday = useCallback(() => {
    setWeekOffset(0);
    onTodayPress();
  }, [onTodayPress]);

  return (
    <View
      className="bg-white rounded-2xl border border-neutral-200 p-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Month header + nav */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={goToPrevWeek} className="p-1.5 rounded-lg">
          <Text className="text-neutral-400 text-sm">‹</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-neutral-700">{monthLabel}</Text>
          {weekOffset !== 0 && (
            <TouchableOpacity onPress={goToToday} className="px-2 py-0.5 rounded-full bg-teal-50">
              <Text className="text-teal-600" style={{ fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={goToNextWeek} className="p-1.5 rounded-lg">
          <Text className="text-neutral-400 text-sm">›</Text>
        </TouchableOpacity>
      </View>

      {/* 7-column day layout */}
      <View className="flex-row">
        {weekDays.map((day, i) => {
          const dayKey = toDateString(day, timezone);
          const isSelected = dayKey === selectedKey;
          const isTodayDate = dayKey === todayKey;
          const isFuture = dayKey > todayKey;
          const spent = spendingByDay.get(dayKey) ?? 0;
          const dayNum = formatDate(day, timezone, "d");

          return (
            <TouchableOpacity
              key={dayKey}
              onPress={() => onSelectDate(day)}
              className={`flex-1 items-center py-2 rounded-xl ${
                isSelected
                  ? "bg-neutral-900"
                  : isTodayDate
                    ? "bg-teal-50"
                    : ""
              }`}
            >
              <Text
                className={`font-medium uppercase ${
                  isSelected
                    ? "text-neutral-400"
                    : isTodayDate
                      ? "text-teal-500"
                      : "text-neutral-400"
                }`}
                style={{ fontSize: 10 }}
              >
                {WEEKDAY_LETTERS[i]}
              </Text>
              <Text
                className={`text-sm font-semibold ${
                  isSelected
                    ? "text-white"
                    : isTodayDate
                      ? "text-teal-700"
                      : "text-neutral-700"
                }`}
              >
                {dayNum}
              </Text>
              <View
                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  isSelected
                    ? spent > 0
                      ? "bg-white/60"
                      : "bg-neutral-600"
                    : getSpendingDotColor(spent, dailyLimit, isFuture)
                }`}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

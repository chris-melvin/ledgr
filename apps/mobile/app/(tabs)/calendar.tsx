import { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, type DateData } from "react-native-calendars";
import { useSQLiteContext } from "expo-sqlite";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
  toDateString,
  DATE_FORMATS,
} from "@repo/shared/date";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useExpenses } from "@/hooks/use-expenses";
import { ExpenseDao } from "@/lib/db/expense-dao";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import { useCategories } from "@/hooks/use-categories";
import type { LocalExpense } from "@/lib/db/expense-dao";

export default function CalendarScreen() {
  const timezone = useTimezone();
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { categories } = useCategories();

  const today = toDateString(new Date().toISOString(), timezone);
  const [selectedDate, setSelectedDate] = useState(today);
  const [markedDates, setMarkedDates] = useState<
    Record<string, { marked: boolean; dotColor: string }>
  >({});
  const [currentMonth, setCurrentMonth] = useState(today);
  const [editingExpense, setEditingExpense] = useState<LocalExpense | null>(null);

  const dao = useMemo(() => new ExpenseDao(db), [db]);

  // Date range for selected day's expenses
  const selectedTimestamp = `${selectedDate}T00:00:00.000Z`;
  const startOfDay = getStartOfDay(selectedTimestamp, timezone);
  const endOfDay = getEndOfDay(selectedTimestamp, timezone);

  const { expenses, total, updateExpense, deleteExpense } = useExpenses(
    startOfDay,
    endOfDay
  );

  // Load marked dates for the visible month
  const loadMarkedDates = useCallback(async () => {
    if (!user) return;
    const monthTimestamp = `${currentMonth}T00:00:00.000Z`;
    const monthStart = getStartOfMonth(monthTimestamp, timezone);
    const monthEnd = getEndOfMonth(monthTimestamp, timezone);

    const dates = await dao.findDatesWithExpenses(user.id, monthStart, monthEnd);
    const marks: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const d of dates) {
      marks[d] = { marked: true, dotColor: "#10b981" };
    }
    setMarkedDates(marks);
  }, [dao, user, currentMonth, timezone]);

  useEffect(() => {
    loadMarkedDates();
  }, [loadMarkedDates]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString);
  };

  // Combine marked dates with selected date highlight
  const calendarMarks = useMemo(() => {
    const marks = { ...markedDates };
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      marked: marks[selectedDate]?.marked || false,
      dotColor: "#10b981",
      selected: true,
      selectedColor: "#10b981",
    } as any;
    return marks;
  }, [markedDates, selectedDate]);

  const dateLabel = formatDate(
    `${selectedDate}T12:00:00.000Z`,
    timezone,
    DATE_FORMATS.WEEKDAY_SHORT
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-2 pb-3">
        <Text className="text-2xl font-bold">Calendar</Text>
      </View>

      <Calendar
        current={currentMonth}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markedDates={calendarMarks}
        theme={{
          todayTextColor: "#10b981",
          selectedDayBackgroundColor: "#10b981",
          arrowColor: "#10b981",
          dotColor: "#10b981",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
      />

      {/* Selected day info */}
      <View className="px-6 py-3 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-gray-600">{dateLabel}</Text>
        {total > 0 && (
          <Text className="text-sm font-semibold text-gray-900">
            Total: ₱{total.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Expenses for selected day */}
      <View className="flex-1">
        <ExpenseList
          expenses={expenses}
          timezone={timezone}
          onDelete={deleteExpense}
          onEdit={setEditingExpense}
        />
      </View>

      {/* Edit modal */}
      <ExpenseEditModal
        expense={editingExpense}
        visible={!!editingExpense}
        timezone={timezone}
        existingCategories={categories}
        onClose={() => setEditingExpense(null)}
        onSave={updateExpense}
        onDelete={deleteExpense}
      />
    </SafeAreaView>
  );
}

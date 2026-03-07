import { useState, useCallback } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getTodayTimestamp,
  getStartOfDay,
  getEndOfDay,
  formatDate,
  addDaysToTimestamp,
  subtractDaysFromTimestamp,
  DATE_FORMATS,
} from "@repo/shared/date";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useExpenses } from "@/hooks/use-expenses";
import { useSyncStatus } from "@/hooks/use-sync";
import { HeroDailyCard } from "@/components/dashboard/hero-daily-card";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { ExpenseList } from "@/components/expenses/expense-list";
import { SmartInput } from "@/components/expenses/smart-input";

export default function TodayScreen() {
  const timezone = useTimezone();
  const [selectedDate, setSelectedDate] = useState(() => getTodayTimestamp(timezone));
  const [showInput, setShowInput] = useState(false);
  const { status } = useSyncStatus();

  const startOfDay = getStartOfDay(selectedDate, timezone);
  const endOfDay = getEndOfDay(selectedDate, timezone);

  const { expenses, total, addExpense, deleteExpense, refresh } = useExpenses(
    startOfDay,
    endOfDay
  );

  const dateLabel = formatDate(selectedDate, timezone, DATE_FORMATS.WEEKDAY_SHORT);

  const handleAddExpense = useCallback(
    async (expense: { amount: number; label: string; occurred_at: string }) => {
      await addExpense(expense);
    },
    [addExpense]
  );

  const handlePrevDay = () => {
    setSelectedDate((prev) => subtractDaysFromTimestamp(prev, 1, timezone));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDaysToTimestamp(prev, 1, timezone));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
        <Text className="text-2xl font-bold">ledgr</Text>
        <View className="flex-row items-center">
          {status === "syncing" && (
            <Text className="text-xs text-gray-400 mr-2">syncing...</Text>
          )}
          {status === "offline" && (
            <Text className="text-xs text-orange-400 mr-2">offline</Text>
          )}
          {status === "error" && (
            <Text className="text-xs text-red-400 mr-2">sync error</Text>
          )}
        </View>
      </View>

      {/* Week strip */}
      <WeekStrip
        selectedDate={selectedDate}
        timezone={timezone}
        onSelectDate={setSelectedDate}
      />

      {/* Day navigation */}
      <View className="flex-row items-center justify-between px-6 mb-2">
        <TouchableOpacity onPress={handlePrevDay} className="p-2">
          <Text className="text-gray-400 text-lg">&lt;</Text>
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-600">{dateLabel}</Text>
        <TouchableOpacity onPress={handleNextDay} className="p-2">
          <Text className="text-gray-400 text-lg">&gt;</Text>
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <HeroDailyCard total={total} date={dateLabel} />

      {/* Expense list */}
      <View className="flex-1">
        <ExpenseList
          expenses={expenses}
          timezone={timezone}
          onDelete={deleteExpense}
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowInput(true)}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-emerald-500 items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>

      {/* Smart input modal */}
      <SmartInput
        visible={showInput}
        timezone={timezone}
        onClose={() => setShowInput(false)}
        onSubmit={handleAddExpense}
      />
    </SafeAreaView>
  );
}

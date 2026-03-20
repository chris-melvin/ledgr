import { useState, useCallback } from "react";
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  getTodayTimestamp,
  getStartOfDay,
  getEndOfDay,
} from "@repo/shared/date";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useExpenses } from "@/hooks/use-expenses";
import { useSyncStatus } from "@/hooks/use-sync";
import { useCategories } from "@/hooks/use-categories";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { HeroDailyCard } from "@/components/dashboard/hero-daily-card";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { ExpenseList } from "@/components/expenses/expense-list";
import { SmartInput } from "@/components/expenses/smart-input";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import type { LocalExpense } from "@/lib/db/expense-dao";

export default function TodayScreen() {
  const timezone = useTimezone();
  const { settings } = useSettingsContext();
  const [selectedDate, setSelectedDate] = useState(() => getTodayTimestamp(timezone));
  const [showInput, setShowInput] = useState(false);
  const [editingExpense, setEditingExpense] = useState<LocalExpense | null>(null);
  const { status } = useSyncStatus();
  const { categories } = useCategories();
  const { shortcutMap } = useShortcuts();

  const startOfDay = getStartOfDay(selectedDate, timezone);
  const endOfDay = getEndOfDay(selectedDate, timezone);

  const { expenses, total, addExpense, updateExpense, deleteExpense } =
    useExpenses(startOfDay, endOfDay);

  const limit = settings.calculated_daily_limit ?? settings.default_daily_limit;
  const isBudgetMode = settings.tracking_mode === "budget_enabled";
  const remaining = limit - total;

  const heroExpenses = expenses.map((e) => ({
    label: e.label,
    amount: e.amount,
  }));

  const handleAddExpense = useCallback(
    async (expense: { amount: number; label: string; category?: string; occurred_at: string }) => {
      await addExpense(expense);
    },
    [addExpense]
  );

  const handleTodayPress = useCallback(() => {
    setSelectedDate(getTodayTimestamp(timezone));
  }, [timezone]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FDFBF7" }}>
      {/* Header */}
      <View className="h-14 px-3 flex-row items-center justify-between border-b border-neutral-200 bg-white">
        <Text className="text-base font-bold text-neutral-800 tracking-tight">ledgr</Text>
        <View className="flex-row items-center">
          {status === "syncing" && (
            <Text className="text-xs text-neutral-400 mr-2">syncing...</Text>
          )}
          {status === "offline" && (
            <Text className="text-xs text-amber-500 mr-2">offline</Text>
          )}
          {status === "error" && (
            <Text className="text-xs text-rose-500 mr-2">sync error</Text>
          )}
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <WeekStrip
          selectedDate={selectedDate}
          timezone={timezone}
          onSelectDate={setSelectedDate}
          expenses={expenses}
          dailyLimit={limit}
          onTodayPress={handleTodayPress}
        />

        <HeroDailyCard
          spent={total}
          remaining={remaining}
          limit={limit}
          expenses={heroExpenses}
          selectedDate={selectedDate}
          timezone={timezone}
          isBudgetMode={isBudgetMode}
        />

        <ExpenseList
          expenses={expenses}
          timezone={timezone}
          onDelete={deleteExpense}
          onEdit={setEditingExpense}
        />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowInput(true)}
        className="absolute bottom-6 right-4 w-14 h-14 rounded-2xl items-center justify-center overflow-hidden"
        style={styles.fab}
      >
        <LinearGradient
          colors={["#14b8a6", "#0d9488"]}
          style={StyleSheet.absoluteFill}
        />
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>

      {/* Smart input modal */}
      <SmartInput
        visible={showInput}
        timezone={timezone}
        categories={categories}
        shortcutMap={shortcutMap}
        onClose={() => setShowInput(false)}
        onSubmit={handleAddExpense}
      />

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

const styles = StyleSheet.create({
  fab: {
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

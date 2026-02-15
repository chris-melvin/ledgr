import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { CURRENCY } from "@repo/shared/constants";
import { formatDate, DATE_FORMATS } from "@repo/shared/date";
import type { LocalExpense } from "@/lib/db/expense-dao";

interface ExpenseListProps {
  expenses: LocalExpense[];
  timezone: string;
  onDelete: (id: string) => void;
}

function ExpenseItem({
  expense,
  timezone,
  onDelete,
}: {
  expense: LocalExpense;
  timezone: string;
  onDelete: (id: string) => void;
}) {
  const handleLongPress = () => {
    Alert.alert("Delete Expense", `Delete "${expense.label}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(expense.id) },
    ]);
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-50"
    >
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{expense.label}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {formatDate(expense.occurred_at, timezone, DATE_FORMATS.TIME_12H)}
          {expense.category ? ` · ${expense.category}` : ""}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-semibold text-gray-900">
          {CURRENCY}{expense.amount.toLocaleString()}
        </Text>
        {expense.is_synced === 0 && (
          <Text className="text-[10px] text-orange-400 mt-0.5">pending sync</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function ExpenseList({ expenses, timezone, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-gray-400 text-base">No expenses yet today</Text>
        <Text className="text-gray-300 text-sm mt-1">Tap + to add one</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ExpenseItem expense={item} timezone={timezone} onDelete={onDelete} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

import { useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import { CURRENCY } from "@repo/shared/constants";
import { formatDate, DATE_FORMATS } from "@repo/shared/date";
import type { LocalExpense } from "@/lib/db/expense-dao";

interface ExpenseListProps {
  expenses: LocalExpense[];
  timezone: string;
  onDelete: (id: string) => void;
  onEdit: (expense: LocalExpense) => void;
}

const SWIPE_THRESHOLD = -80;

function ExpenseItem({
  expense,
  timezone,
  onDelete,
  onEdit,
}: {
  expense: LocalExpense;
  timezone: string;
  onDelete: (id: string) => void;
  onEdit: (expense: LocalExpense) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        } else if (isSwipedOpen.current) {
          translateX.setValue(Math.min(gestureState.dx + SWIPE_THRESHOLD, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = false;
        }
      },
    })
  ).current;

  const handlePress = () => {
    if (isSwipedOpen.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      isSwipedOpen.current = false;
      return;
    }
    onEdit(expense);
  };

  return (
    <View className="relative overflow-hidden">
      {/* Delete action behind */}
      <TouchableOpacity
        onPress={() => onDelete(expense.id)}
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 items-center justify-center"
      >
        <Text className="text-white text-xs font-medium">Delete</Text>
      </TouchableOpacity>

      {/* Foreground content */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-neutral-100"
        >
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-800">
              {expense.label}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-neutral-500" style={{ fontSize: 10 }}>
                {formatDate(expense.occurred_at, timezone, DATE_FORMATS.TIME_12H)}
              </Text>
              {expense.category ? (
                <View className="px-1.5 py-0.5 rounded bg-neutral-100">
                  <Text className="text-neutral-600" style={{ fontSize: 9 }}>
                    {expense.category}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View className="items-end">
            <Text className="text-sm font-semibold text-neutral-700">
              -{CURRENCY}
              {expense.amount.toLocaleString()}
            </Text>
            {expense.is_synced === 0 && (
              <Text className="text-amber-500 mt-0.5" style={{ fontSize: 10 }}>
                pending sync
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export function ExpenseList({
  expenses,
  timezone,
  onDelete,
  onEdit,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <View
        className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 2,
        }}
      >
        <View className="items-center justify-center py-12">
          <Text className="text-neutral-400 text-sm">No expenses yet today</Text>
          <Text className="text-neutral-300 text-xs mt-1">Tap + to add one</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View className="px-4 py-3 border-b border-neutral-100 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-900">Today's Transactions</Text>
        <Text className="text-xs text-neutral-400">{expenses.length} total</Text>
      </View>

      {/* Items */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            timezone={timezone}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

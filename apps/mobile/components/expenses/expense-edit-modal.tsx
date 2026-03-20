import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { formatDate } from "@repo/shared/date";
import type { LocalExpense, UpdateExpenseInput } from "@/lib/db/expense-dao";

interface ExpenseEditModalProps {
  expense: LocalExpense | null;
  visible: boolean;
  timezone: string;
  existingCategories: string[];
  onClose: () => void;
  onSave: (id: string, updates: UpdateExpenseInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export function ExpenseEditModal({
  expense,
  visible,
  timezone,
  existingCategories,
  onClose,
  onSave,
  onDelete,
}: ExpenseEditModalProps) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setLabel(expense.label);
      setCategory(expense.category || "");
    }
  }, [expense]);

  const handleSave = () => {
    if (!expense) return;

    const updates: UpdateExpenseInput = {};
    const newAmount = parseFloat(amount);
    if (!isNaN(newAmount) && newAmount > 0 && newAmount !== expense.amount) {
      updates.amount = newAmount;
    }
    if (label.trim() && label.trim() !== expense.label) {
      updates.label = label.trim();
    }
    if (category !== (expense.category || "")) {
      updates.category = category || undefined;
    }

    onClose();
    if (Object.keys(updates).length > 0) {
      onSave(expense.id, updates);
    }
  };

  const handleDelete = () => {
    if (!expense) return;
    onDelete(expense.id);
    onClose();
  };

  if (!expense) return null;

  const timeLabel = formatDate(expense.occurred_at, timezone, "h:mm a");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-lg">
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-6" />

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-semibold">Edit Expense</Text>
            <Text className="text-xs text-gray-400">{timeLabel}</Text>
          </View>

          {/* Amount & Label */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Label
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base"
                value={label}
                onChangeText={setLabel}
                autoCapitalize="sentences"
              />
            </View>
            <View className="w-28">
              <Text className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Amount
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Category chips */}
          <View className="mb-5">
            <Text className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={() => setCategory("")}
                className={`mr-2 px-3 py-1.5 rounded-full border ${
                  category === ""
                    ? "bg-emerald-500 border-emerald-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs ${
                    category === "" ? "text-white font-medium" : "text-gray-500"
                  }`}
                >
                  None
                </Text>
              </TouchableOpacity>
              {existingCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-2 px-3 py-1.5 rounded-full border ${
                    category === cat
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      category === cat
                        ? "text-white font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleDelete}
              className="px-4 py-3 rounded-xl bg-red-50"
            >
              <Text className="text-red-600 text-sm font-medium">Delete</Text>
            </TouchableOpacity>
            <View className="flex-1" />
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-3 rounded-xl"
            >
              <Text className="text-gray-400 text-sm font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!amount || !label.trim()}
              className={`px-6 py-3 rounded-xl ${
                !amount || !label.trim() ? "bg-gray-200" : "bg-emerald-500"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  !amount || !label.trim() ? "text-gray-400" : "text-white"
                }`}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

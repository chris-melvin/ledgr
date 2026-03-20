import { useState, useCallback } from "react";
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
import { TEMPLATES, CURRENCY } from "@repo/shared/constants";
import { getCurrentTimestamp } from "@repo/shared/date";
import {
  parseExpenseInput,
  type ParsedExpense,
  type ShortcutEntry,
} from "@/lib/parser/expense-parser";

interface SmartInputProps {
  visible: boolean;
  timezone: string;
  categories: string[];
  shortcutMap?: Map<string, ShortcutEntry>;
  onClose: () => void;
  onSubmit: (expense: {
    amount: number;
    label: string;
    category?: string;
    occurred_at: string;
  }) => void;
}

export function SmartInput({
  visible,
  timezone,
  categories,
  shortcutMap,
  onClose,
  onSubmit,
}: SmartInputProps) {
  const [nlpInput, setNlpInput] = useState("");
  const [preview, setPreview] = useState<ParsedExpense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  const handleNlpChange = useCallback((text: string) => {
    setNlpInput(text);
    if (!text.trim()) {
      setPreview([]);
      return;
    }
    const result = parseExpenseInput(text, shortcutMap);
    setPreview(result || []);
  }, []);

  const handleNlpSubmit = () => {
    if (preview.length === 0) return;

    const now = getCurrentTimestamp(timezone);
    for (const expense of preview) {
      let occurredAt = now;

      // Apply parsed time if present
      if (expense.parsedTime) {
        const d = expense.parsedTime.date ? new Date(expense.parsedTime.date) : new Date();
        if (expense.parsedTime.hours !== undefined) {
          d.setHours(expense.parsedTime.hours, expense.parsedTime.minutes ?? 0, 0, 0);
        }
        occurredAt = d.toISOString();
      }

      onSubmit({
        amount: expense.amount,
        label: expense.label,
        category: selectedCategory || expense.category,
        occurred_at: occurredAt,
      });
    }
    resetAndClose();
  };

  const handleTemplatePress = (template: (typeof TEMPLATES)[number]) => {
    onSubmit({
      amount: template.amount,
      label: template.label,
      category: selectedCategory || undefined,
      occurred_at: getCurrentTimestamp(timezone),
    });
    resetAndClose();
  };

  const handleManualSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || !label.trim()) return;

    onSubmit({
      amount: parsedAmount,
      label: label.trim(),
      category: selectedCategory || undefined,
      occurred_at: getCurrentTimestamp(timezone),
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setNlpInput("");
    setPreview([]);
    setSelectedCategory("");
    setAmount("");
    setLabel("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={resetAndClose}
        />
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-lg">
          <View className="w-10 h-1 bg-neutral-300 rounded-full self-center mb-6" />

          <Text className="text-lg font-semibold mb-4">Add Expense</Text>

          {/* NLP Input */}
          <View className="mb-3">
            <TextInput
              className="bg-neutral-50 border-2 border-neutral-200 rounded-2xl px-4 py-3 text-base"
              placeholder='Try "coffee 120" or "lunch at 2pm"'
              placeholderTextColor="#a3a3a3"
              value={nlpInput}
              onChangeText={handleNlpChange}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleNlpSubmit}
            />
            {/* Preview */}
            {preview.length > 0 && (
              <View className="mt-2 px-2">
                {preview.map((p, i) => (
                  <View
                    key={i}
                    className="flex-row items-center justify-between py-1"
                  >
                    <Text className="text-sm text-gray-600">
                      {p.label}
                      {p.category ? ` · ${p.category}` : ""}
                    </Text>
                    <Text className="text-sm font-semibold text-teal-600">
                      {CURRENCY}
                      {p.amount}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={handleNlpSubmit}
                  className="mt-2 bg-neutral-900 rounded-2xl py-3 items-center"
                >
                  <Text className="text-white font-semibold text-sm">
                    Add {preview.length > 1 ? `${preview.length} expenses` : "expense"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Category chips */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() =>
                    setSelectedCategory((prev) =>
                      prev === cat ? "" : cat
                    )
                  }
                  className={`mr-2 px-3 py-1.5 rounded-full border ${
                    selectedCategory === cat
                      ? "bg-teal-500 border-teal-500"
                      : "bg-white border-neutral-200"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedCategory === cat
                        ? "text-white font-medium"
                        : "text-neutral-500"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Quick templates */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleTemplatePress(template)}
                className="items-center mr-4 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-100 min-w-[72px]"
              >
                <Text className="text-xs text-neutral-500">{template.label}</Text>
                <Text className="text-sm font-semibold mt-0.5">
                  {CURRENCY}
                  {template.amount}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual entry */}
          <View className="flex-row gap-3 mb-4">
            <TextInput
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-base"
              placeholder="Label"
              value={label}
              onChangeText={setLabel}
              autoCapitalize="sentences"
            />
            <TextInput
              className="w-28 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-base"
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            onPress={handleManualSubmit}
            className="bg-neutral-900 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Add</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

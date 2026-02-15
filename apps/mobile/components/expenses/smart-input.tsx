import { useState } from "react";
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

interface SmartInputProps {
  visible: boolean;
  timezone: string;
  onClose: () => void;
  onSubmit: (expense: { amount: number; label: string; occurred_at: string }) => void;
}

export function SmartInput({ visible, timezone, onClose, onSubmit }: SmartInputProps) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  const handleTemplatePress = (template: (typeof TEMPLATES)[number]) => {
    onSubmit({
      amount: template.amount,
      label: template.label,
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
      occurred_at: getCurrentTimestamp(timezone),
    });
    resetAndClose();
  };

  const resetAndClose = () => {
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
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-6" />

          <Text className="text-lg font-semibold mb-4">Add Expense</Text>

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
                className="items-center mr-4 px-3 py-2 bg-gray-50 rounded-xl min-w-[72px]"
              >
                <Text className="text-xs text-gray-500">{template.label}</Text>
                <Text className="text-sm font-semibold mt-0.5">
                  {CURRENCY}{template.amount}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual entry */}
          <View className="flex-row gap-3 mb-4">
            <TextInput
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Label"
              value={label}
              onChangeText={setLabel}
              autoCapitalize="sentences"
            />
            <TextInput
              className="w-28 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            onPress={handleManualSubmit}
            className="bg-emerald-500 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Add</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

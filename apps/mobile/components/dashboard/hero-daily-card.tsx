import { View, Text } from "react-native";
import { CURRENCY, DEFAULT_DAILY_LIMIT } from "@repo/shared/constants";

interface HeroDailyCardProps {
  total: number;
  date: string;
}

export function HeroDailyCard({ total, date }: HeroDailyCardProps) {
  const remaining = DEFAULT_DAILY_LIMIT - total;
  const isOver = remaining < 0;
  const progress = Math.min(total / DEFAULT_DAILY_LIMIT, 1);

  return (
    <View className="bg-white rounded-2xl p-6 mx-4 mb-4 shadow-sm border border-gray-100">
      <Text className="text-sm text-gray-500 mb-1">{date}</Text>

      <Text className="text-4xl font-bold tracking-tight mb-1">
        {CURRENCY}{total.toLocaleString()}
      </Text>

      <Text className={`text-sm ${isOver ? "text-red-500" : "text-gray-500"}`}>
        {isOver
          ? `${CURRENCY}${Math.abs(remaining).toLocaleString()} over limit`
          : `${CURRENCY}${remaining.toLocaleString()} remaining`}
      </Text>

      {/* Progress bar */}
      <View className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-row justify-between mt-2">
        <Text className="text-xs text-gray-400">
          {CURRENCY}0
        </Text>
        <Text className="text-xs text-gray-400">
          {CURRENCY}{DEFAULT_DAILY_LIMIT}
        </Text>
      </View>
    </View>
  );
}

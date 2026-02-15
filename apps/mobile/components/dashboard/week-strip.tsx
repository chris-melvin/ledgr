import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import {
  getStartOfWeek,
  addDaysToTimestamp,
  toDateString,
  formatDate,
  isToday as checkIsToday,
  DATE_FORMATS,
} from "@repo/shared/date";

interface WeekStripProps {
  selectedDate: string;
  timezone: string;
  onSelectDate: (dateTimestamp: string) => void;
}

export function WeekStrip({ selectedDate, timezone, onSelectDate }: WeekStripProps) {
  const weekStart = getStartOfWeek(selectedDate, timezone, 0);
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    days.push(addDaysToTimestamp(weekStart, i, timezone));
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-2 mb-4"
      contentContainerStyle={{ paddingHorizontal: 8 }}
    >
      {days.map((day) => {
        const dateStr = toDateString(day, timezone);
        const selectedStr = toDateString(selectedDate, timezone);
        const isSelected = dateStr === selectedStr;
        const isTodayDate = checkIsToday(day, timezone);

        return (
          <TouchableOpacity
            key={dateStr}
            onPress={() => onSelectDate(day)}
            className={`items-center px-3 py-2 mx-1 rounded-xl min-w-[48px] ${
              isSelected ? "bg-emerald-500" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-xs mb-1 ${
                isSelected ? "text-white" : "text-gray-400"
              }`}
            >
              {formatDate(day, timezone, "EEE")}
            </Text>
            <Text
              className={`text-lg font-semibold ${
                isSelected ? "text-white" : isTodayDate ? "text-emerald-500" : "text-gray-900"
              }`}
            >
              {formatDate(day, timezone, "d")}
            </Text>
            {isTodayDate && !isSelected && (
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Calendar</Text>
        <Text className="text-base text-gray-400 text-center">
          Monthly calendar view coming soon.{"\n"}
          Use the Today tab to navigate by day.
        </Text>
      </View>
    </SafeAreaView>
  );
}

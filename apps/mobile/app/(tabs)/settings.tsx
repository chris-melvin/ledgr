import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/components/providers/auth-provider";
import { useSyncStatus } from "@/hooks/use-sync";
import { CURRENCY, DEFAULT_DAILY_LIMIT } from "@repo/shared/constants";
import { useTimezone } from "@/components/providers/timezone-provider";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { status, triggerSync } = useSyncStatus();
  const timezone = useTimezone();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4">
        <Text className="text-2xl font-bold mb-6">Settings</Text>

        {/* Account section */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Account
          </Text>
          <Text className="text-base text-gray-900">{user?.email ?? "Not signed in"}</Text>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Preferences
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-600">Currency</Text>
            <Text className="text-base text-gray-900">{CURRENCY}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-600">Daily Limit</Text>
            <Text className="text-base text-gray-900">
              {CURRENCY}{DEFAULT_DAILY_LIMIT}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-base text-gray-600">Timezone</Text>
            <Text className="text-base text-gray-900">{timezone}</Text>
          </View>
        </View>

        {/* Sync */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Sync
          </Text>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base text-gray-600">Status</Text>
            <Text
              className={`text-sm font-medium ${
                status === "idle"
                  ? "text-emerald-500"
                  : status === "syncing"
                    ? "text-blue-500"
                    : status === "offline"
                      ? "text-orange-500"
                      : "text-red-500"
              }`}
            >
              {status}
            </Text>
          </View>
          <TouchableOpacity
            onPress={triggerSync}
            className="bg-gray-50 rounded-lg py-3 items-center"
          >
            <Text className="text-emerald-500 font-medium">Sync Now</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-white rounded-xl p-4 items-center"
        >
          <Text className="text-red-500 font-medium text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

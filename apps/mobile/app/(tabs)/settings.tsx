import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/components/providers/auth-provider";
import { useSyncStatus } from "@/hooks/use-sync";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTimezone } from "@/components/providers/timezone-provider";

const CURRENCY_OPTIONS = ["PHP", "USD", "EUR", "GBP", "JPY"];
const WEEK_START_OPTIONS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Saturday", value: 6 },
];
const TRACKING_MODE_OPTIONS = [
  { label: "Tracking Only", value: "tracking_only" },
  { label: "Budget Enabled", value: "budget_enabled" },
];

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row justify-between items-center py-2.5"
    >
      <Text className="text-base text-gray-600">{label}</Text>
      <Text className="text-base text-gray-900">{value}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { status, triggerSync } = useSyncStatus();
  const { settings, updateSetting, isPro } = useSettingsContext();
  const timezone = useTimezone();

  const currencySymbol = settings.currency === "PHP" ? "₱" : settings.currency;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      "Currency",
      "Select your currency",
      CURRENCY_OPTIONS.map((c) => ({
        text: c,
        onPress: () => updateSetting("currency", c),
      }))
    );
  };

  const handleWeekStartChange = () => {
    Alert.alert(
      "Week Starts On",
      "Select the first day of the week",
      WEEK_START_OPTIONS.map((opt) => ({
        text: opt.label,
        onPress: () => updateSetting("week_starts_on", opt.value),
      }))
    );
  };

  const handleTrackingModeChange = () => {
    Alert.alert(
      "Tracking Mode",
      "Select how you want to track expenses",
      TRACKING_MODE_OPTIONS.map((opt) => ({
        text: opt.label,
        onPress: () => updateSetting("tracking_mode", opt.value),
      }))
    );
  };

  const handleDailyLimitChange = () => {
    Alert.prompt(
      "Daily Limit",
      `Enter your daily spending limit (${currencySymbol})`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (value?: string) => {
            const num = parseFloat(value ?? "");
            if (!isNaN(num) && num > 0) {
              updateSetting("default_daily_limit", num);
            }
          },
        },
      ],
      "plain-text",
      String(settings.default_daily_limit)
    );
  };

  const weekStartLabel =
    WEEK_START_OPTIONS.find((o) => o.value === settings.week_starts_on)?.label ?? "Sunday";
  const trackingModeLabel =
    TRACKING_MODE_OPTIONS.find((o) => o.value === settings.tracking_mode)?.label ??
    "Tracking Only";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="px-6 pt-4">
        <Text className="text-2xl font-bold mb-6">Settings</Text>

        {/* Account section */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Account
          </Text>
          <Text className="text-base text-gray-900">
            {user?.email ?? "Not signed in"}
          </Text>
          <View className="flex-row items-center mt-2">
            <View
              className={`px-2 py-0.5 rounded-full ${
                isPro ? "bg-emerald-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isPro ? "text-emerald-700" : "text-gray-500"
                }`}
              >
                {isPro ? "Pro" : "Free"}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Preferences
          </Text>
          <SettingRow
            label="Currency"
            value={settings.currency}
            onPress={handleCurrencyChange}
          />
          <SettingRow
            label="Daily Limit"
            value={`${currencySymbol}${settings.default_daily_limit}`}
            onPress={handleDailyLimitChange}
          />
          <SettingRow
            label="Tracking Mode"
            value={trackingModeLabel}
            onPress={handleTrackingModeChange}
          />
          <SettingRow
            label="Week Starts On"
            value={weekStartLabel}
            onPress={handleWeekStartChange}
          />
          <SettingRow label="Timezone" value={timezone} />
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
          className="bg-white rounded-xl p-4 items-center mb-8"
        >
          <Text className="text-red-500 font-medium text-base">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

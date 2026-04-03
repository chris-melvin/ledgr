import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { SettingsSection } from "./settings-section";
import { SelectSheet } from "@/components/ui/select-sheet";
import { ToggleRow } from "@/components/ui/toggle-row";
import { selection } from "@/lib/haptics";

const CURRENCY_OPTIONS = [
  { label: "PHP (\u20B1)", value: "PHP" },
  { label: "USD ($)", value: "USD" },
  { label: "EUR (\u20AC)", value: "EUR" },
  { label: "GBP (\u00A3)", value: "GBP" },
  { label: "JPY (\u00A5)", value: "JPY" },
  { label: "AUD (A$)", value: "AUD" },
  { label: "CAD (C$)", value: "CAD" },
  { label: "SGD (S$)", value: "SGD" },
  { label: "HKD (HK$)", value: "HKD" },
  { label: "KRW (\u20A9)", value: "KRW" },
];

const TIMEZONE_OPTIONS = [
  { label: "Manila (GMT+8)", value: "Asia/Manila" },
  { label: "Singapore (GMT+8)", value: "Asia/Singapore" },
  { label: "Tokyo (GMT+9)", value: "Asia/Tokyo" },
  { label: "Hong Kong (GMT+8)", value: "Asia/Hong_Kong" },
  { label: "New York (GMT-5)", value: "America/New_York" },
  { label: "Los Angeles (GMT-8)", value: "America/Los_Angeles" },
  { label: "Chicago (GMT-6)", value: "America/Chicago" },
  { label: "London (GMT+0)", value: "Europe/London" },
  { label: "Paris (GMT+1)", value: "Europe/Paris" },
  { label: "Sydney (GMT+11)", value: "Australia/Sydney" },
];

const WEEK_START_OPTIONS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Saturday", value: 6 },
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
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
    >
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View className="flex-row items-center">
        <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{value}</Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

export function GeneralSettings() {
  const { settings, updateSetting } = useSettingsContext();
  const timezone = useTimezone();
  const { colors } = useTheme();
  const [showCurrency, setShowCurrency] = useState(false);
  const [showTimezone, setShowTimezone] = useState(false);
  const [showWeekStart, setShowWeekStart] = useState(false);

  const trackingMode = settings.tracking_mode ?? "tracking_only";
  const weekStartLabel =
    WEEK_START_OPTIONS.find((o) => o.value === settings.week_starts_on)?.label ?? "Sunday";

  return (
    <>
      {/* Tracking Mode */}
      <SettingsSection title="TRACKING MODE">
        <TouchableOpacity
          onPress={() => {
            selection();
            updateSetting("tracking_mode", "tracking_only");
          }}
          style={[
            styles.radioCard,
            { borderColor: colors.border },
            trackingMode === "tracking_only" && styles.radioCardActive,
          ]}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text style={[styles.radioLabel, { color: colors.textPrimary }, trackingMode === "tracking_only" && styles.radioLabelActive]}>
                Simple Tracking
              </Text>
              <Text style={[styles.radioDescription, { color: colors.textTertiary }]}>Just log expenses without budget limits</Text>
            </View>
            <View style={[styles.radioCircle, { borderColor: colors.textMuted }, trackingMode === "tracking_only" && styles.radioCircleActive]}>
              {trackingMode === "tracking_only" && <View style={styles.radioCircleFill} />}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            selection();
            updateSetting("tracking_mode", "budget_enabled");
          }}
          style={[
            styles.radioCard,
            { borderColor: colors.border },
            trackingMode === "budget_enabled" && styles.radioCardActive,
            { marginTop: 8 },
          ]}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text style={[styles.radioLabel, { color: colors.textPrimary }, trackingMode === "budget_enabled" && styles.radioLabelActive]}>
                Budget Mode
              </Text>
              <Text style={[styles.radioDescription, { color: colors.textTertiary }]}>Track expenses against a daily spending limit</Text>
            </View>
            <View style={[styles.radioCircle, { borderColor: colors.textMuted }, trackingMode === "budget_enabled" && styles.radioCircleActive]}>
              {trackingMode === "budget_enabled" && <View style={styles.radioCircleFill} />}
            </View>
          </View>
        </TouchableOpacity>
      </SettingsSection>

      {/* Display Preferences */}
      <SettingsSection title="DISPLAY">
        <SettingRow label="Currency" value={settings.currency} onPress={() => setShowCurrency(true)} />
        <Divider />
        <SettingRow label="Timezone" value={timezone.split("/").pop()?.replace("_", " ") ?? timezone} onPress={() => setShowTimezone(true)} />
        <Divider />
        <SettingRow label="Week Starts On" value={weekStartLabel} onPress={() => setShowWeekStart(true)} />
        <Divider />
        <ToggleRow
          label="Show Savings"
          description="Show savings in budget allocation"
          value={settings.show_savings_in_allocation ?? false}
          onToggle={(v) => updateSetting("show_savings_in_allocation", v)}
        />
      </SettingsSection>

      {/* Bottom sheets */}
      <SelectSheet
        visible={showCurrency}
        title="Currency"
        options={CURRENCY_OPTIONS}
        value={settings.currency}
        onSelect={(v) => updateSetting("currency", v)}
        onClose={() => setShowCurrency(false)}
      />
      <SelectSheet
        visible={showTimezone}
        title="Timezone"
        options={TIMEZONE_OPTIONS}
        value={timezone}
        onSelect={(v) => updateSetting("timezone", v)}
        onClose={() => setShowTimezone(false)}
      />
      <SelectSheet
        visible={showWeekStart}
        title="Week Starts On"
        options={WEEK_START_OPTIONS}
        value={settings.week_starts_on}
        onSelect={(v) => updateSetting("week_starts_on", v)}
        onClose={() => setShowWeekStart(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#57534E",
  },
  rowValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#292524",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F4",
  },
  radioCard: {
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 14,
    padding: 14,
  },
  radioCardActive: {
    borderColor: "#1A9E9E",
    backgroundColor: "rgba(26,158,158,0.04)",
  },
  radioLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#292524",
  },
  radioLabelActive: {
    color: "#1A9E9E",
  },
  radioDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#A8A29E",
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D6D3D1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#1A9E9E",
  },
  radioCircleFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1A9E9E",
  },
});

import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate } from "@repo/shared/date";
import { useSettingsContext } from "@/components/providers/settings-provider";
import {
  getThemeColors,
  isDarkTheme,
  getGreeting,
  type CardTheme,
  type BackgroundStyle,
  type BudgetStatus,
  type CardPreferences,
} from "@repo/shared/card-theme";
import { useTheme } from "@/lib/theme/theme-context";
import { CardCustomizeSheet } from "./hero-card/card-customize-sheet";

// Dark-mode friendly defaults when theme is "auto" (replaces flat grey neutrals)
const AUTO_DARK_COLORS = ["#0F2B2B", "#0D3D3D", "#115E5E", "#1A9E9E"];
const AUTO_LIGHT_COLORS = ["#E0F5F0", "#B2ECE0", "#7DD3C4", "#34B8A0"];

interface HeroDailyCardProps {
  spent: number;
  remaining: number;
  limit: number;
  expenses?: Array<{ label: string; amount: number }>;
  selectedDate: string;
  timezone: string;
  isBudgetMode?: boolean;
}

const STATUS_BADGE_CONFIG = {
  safe: { text: "On track", bg: "#F0FDF4", textColor: "#16A34A" },
  close: { text: "Getting close", bg: "#FFFBEB", textColor: "#D97706" },
  low: { text: "Almost there", bg: "#FFF7ED", textColor: "#EA580C" },
  over: { text: "Over budget", bg: "#FFF1F2", textColor: "#E11D48" },
} as const;

export function HeroDailyCard({
  spent,
  remaining,
  limit,
  expenses = [],
  selectedDate,
  timezone,
  isBudgetMode = false,
}: HeroDailyCardProps) {
  const { settings } = useSettingsContext();
  const [showCustomize, setShowCustomize] = useState(false);

  const currency = settings.currency === "PHP" ? "\u20B1" : settings.currency;

  let cardPrefs: CardPreferences = {};
  try {
    cardPrefs = JSON.parse(settings.card_preferences || "{}");
  } catch {
    // ignore
  }

  const theme: CardTheme = cardPrefs.theme ?? "auto";
  const bgStyle: BackgroundStyle = cardPrefs.backgroundStyle ?? "static";
  const displayName = cardPrefs.displayName || "";

  const ratio = spent / limit;
  let status: BudgetStatus = "safe";
  if (ratio >= 1) status = "over";
  else if (ratio >= 0.85) status = "low";
  else if (ratio >= 0.65) status = "close";

  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  // Use brand teal colors for "auto" instead of flat grey neutrals
  const themeColors =
    theme === "auto" && !isBudgetMode
      ? isDark ? AUTO_DARK_COLORS : AUTO_LIGHT_COLORS
      : getThemeColors(theme, status, isBudgetMode);
  const dark = theme === "auto" ? isDark : isDarkTheme(theme);
  const isOver = remaining < 0;
  const progress = Math.min(spent / limit, 1);

  const greeting = displayName ? getGreeting(displayName) : null;

  // Date labels
  const dayLabel = formatDate(selectedDate, timezone, "EEEE").toUpperCase();
  const dateStr = formatDate(selectedDate, timezone, "MMMM d, yyyy");

  // Status badge
  const statusBadge = isBudgetMode ? STATUS_BADGE_CONFIG[status] : null;

  // Progress bar color
  const getProgressColor = () => {
    if (isOver) return "#F43F5E";
    if (ratio >= 0.85) return "#F59E0B";
    if (ratio >= 0.65) return "#FB923C";
    return "#10B981";
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => setShowCustomize(true)}
        className="rounded-3xl overflow-hidden"
        style={[
          styles.card,
          { borderWidth: 1, borderColor: dark ? "transparent" : "rgba(231,229,228,0.6)" },
        ]}
      >
        {/* Background layers based on style */}
        <LinearGradient
          colors={[themeColors[0], themeColors[1], themeColors[2] ?? themeColors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {bgStyle === "mesh" && (
          <>
            <LinearGradient
              colors={[
                themeColors[2] ?? themeColors[1],
                "transparent",
                themeColors[0],
              ]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
            />
            <LinearGradient
              colors={["transparent", themeColors[3] ?? themeColors[1], "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
            />
          </>
        )}
        {bgStyle === "grain" && (
          <>
            <LinearGradient
              colors={[
                themeColors[1],
                "transparent",
                themeColors[2] ?? themeColors[1],
              ]}
              start={{ x: 0.8, y: 0 }}
              end={{ x: 0.2, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)" },
              ]}
            />
          </>
        )}

        <View className="relative p-6">
          {/* Greeting */}
          {greeting && (
            <Text
              style={[
                styles.greetingText,
                { color: dark ? "rgba(255,255,255,0.7)" : "#57534E" },
              ]}
            >
              {greeting}
            </Text>
          )}

          {/* Date header + status badge */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text
                style={[
                  styles.dayLabel,
                  { color: dark ? "rgba(255,255,255,0.5)" : "#A8A29E" },
                ]}
              >
                {dayLabel}
              </Text>
              <Text
                style={[
                  styles.dateStr,
                  { color: dark ? "rgba(255,255,255,0.7)" : "#57534E" },
                ]}
              >
                {dateStr}
              </Text>
            </View>
            {statusBadge && (
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                  {statusBadge.text}
                </Text>
              </View>
            )}
          </View>

          {/* Amount */}
          <Text
            style={[
              styles.amountText,
              { color: dark ? "#FFFFFF" : "#1C1917" },
            ]}
          >
            {currency}{spent.toLocaleString()}
          </Text>
          <Text
            style={[
              styles.subtitleText,
              { color: dark ? "rgba(255,255,255,0.6)" : "#A8A29E" },
            ]}
          >
            {isBudgetMode
              ? isOver
                ? `${currency}${Math.abs(remaining).toLocaleString()} over limit`
                : `${currency}${remaining.toLocaleString()} remaining`
              : "spent today"}
          </Text>

          {/* Progress bar */}
          <View
            className="mt-4 h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: dark ? "rgba(255,255,255,0.2)" : "#F5F5F4" }}
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, backgroundColor: getProgressColor() }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text style={[styles.limitLabel, { color: dark ? "rgba(255,255,255,0.4)" : "#A8A29E" }]}>
              {currency}0
            </Text>
            <Text style={[styles.limitLabel, { color: dark ? "rgba(255,255,255,0.4)" : "#A8A29E" }]}>
              {currency}{limit.toLocaleString()}
            </Text>
          </View>

          {/* Expense chips */}
          {expenses.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {expenses.map((e, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: dark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.8)",
                    borderWidth: 1,
                    borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(231,229,228,0.6)",
                  }}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: dark ? "rgba(255,255,255,0.8)" : "#57534E" },
                    ]}
                  >
                    {e.label}
                  </Text>
                  <Text
                    style={[
                      styles.chipAmount,
                      { color: dark ? "rgba(255,255,255,0.5)" : "#A8A29E" },
                    ]}
                  >
                    {currency}{e.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <CardCustomizeSheet
        visible={showCustomize}
        onClose={() => setShowCustomize(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#1A9E9E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  greetingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 12,
  },
  dayLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  dateStr: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  amountText: {
    fontFamily: "Lora_700Bold",
    fontSize: 36,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  subtitleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  limitLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  chipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  chipAmount: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});

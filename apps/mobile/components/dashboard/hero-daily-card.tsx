import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CURRENCY } from "@repo/shared/constants";
import { formatDate } from "@repo/shared/date";
import { useSettingsContext } from "@/components/providers/settings-provider";
import {
  getThemeColors,
  isDarkTheme,
  getGreeting,
  type CardTheme,
  type BudgetStatus,
  type CardPreferences,
} from "@repo/shared/card-theme";
import { CardCustomizeSheet } from "./hero-card/card-customize-sheet";

interface HeroDailyCardProps {
  spent: number;
  remaining: number;
  limit: number;
  expenses?: Array<{ label: string; amount: number }>;
  selectedDate: string;
  timezone: string;
  isBudgetMode?: boolean;
}

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

  const currency = settings.currency === "PHP" ? "₱" : settings.currency;

  let cardPrefs: CardPreferences = {};
  try {
    cardPrefs = JSON.parse(settings.card_preferences || "{}");
  } catch {
    // ignore
  }

  const theme: CardTheme = cardPrefs.theme ?? "auto";
  const displayName = cardPrefs.displayName || "";

  const ratio = spent / limit;
  let status: BudgetStatus = "safe";
  if (ratio >= 1) status = "over";
  else if (ratio >= 0.85) status = "low";
  else if (ratio >= 0.65) status = "close";

  const themeColors = getThemeColors(theme, status, isBudgetMode);
  const dark = isDarkTheme(theme);
  const isOver = remaining < 0;
  const progress = Math.min(spent / limit, 1);

  const greeting = displayName ? getGreeting(displayName) : null;

  // Date labels
  const dayLabel = formatDate(selectedDate, timezone, "EEEE").toUpperCase();
  const dateStr = formatDate(selectedDate, timezone, "MMMM d, yyyy");

  // Status badge text
  const getStatusBadge = () => {
    if (!isBudgetMode) return null;
    if (isOver) return { text: "Over budget", bg: "bg-rose-50", textColor: "text-rose-600" };
    if (ratio >= 0.85) return { text: "Almost there", bg: "bg-amber-50", textColor: "text-amber-600" };
    if (ratio >= 0.65) return { text: "Getting close", bg: "bg-amber-50", textColor: "text-amber-600" };
    return { text: "On track", bg: "bg-emerald-50", textColor: "text-emerald-600" };
  };

  const statusBadge = getStatusBadge();

  // Progress bar color
  const getProgressColor = () => {
    if (isOver) return "bg-rose-500";
    if (ratio >= 0.85) return "bg-amber-500";
    if (ratio >= 0.65) return "bg-orange-400";
    return "bg-emerald-500";
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => setShowCustomize(true)}
        className="rounded-3xl border overflow-hidden"
        style={[
          styles.card,
          { borderColor: dark ? "transparent" : "#e7e5e4" },
        ]}
      >
        <LinearGradient
          colors={[themeColors[0], themeColors[1], themeColors[2] ?? themeColors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View className="relative p-6">
          {/* Greeting */}
          {greeting && (
            <Text className={`text-sm font-medium mb-3 ${dark ? "text-white/70" : "text-neutral-600"}`}>
              {greeting}
            </Text>
          )}

          {/* Date header + status badge */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text
                className={`font-medium ${dark ? "text-white/50" : "text-neutral-400"}`}
                style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}
              >
                {dayLabel}
              </Text>
              <Text className={`text-sm font-medium ${dark ? "text-white/70" : "text-neutral-600"}`}>
                {dateStr}
              </Text>
            </View>
            {statusBadge && (
              <View className={`px-3 py-1.5 rounded-full ${statusBadge.bg}`}>
                <Text className={`text-xs font-medium ${statusBadge.textColor}`}>
                  {statusBadge.text}
                </Text>
              </View>
            )}
          </View>

          {/* Amount */}
          <Text className={`text-4xl font-bold tracking-tight mb-1 ${dark ? "text-white" : "text-neutral-900"}`}>
            {currency}{spent.toLocaleString()}
          </Text>
          <Text className={`text-sm ${dark ? "text-white/60" : "text-neutral-400"}`}>
            {isBudgetMode
              ? isOver
                ? `${currency}${Math.abs(remaining).toLocaleString()} over limit`
                : `${currency}${remaining.toLocaleString()} remaining`
              : "spent today"}
          </Text>

          {/* Progress bar */}
          <View className={`mt-4 h-2 rounded-full overflow-hidden ${dark ? "bg-white/20" : "bg-neutral-100"}`}>
            <View
              className={`h-full rounded-full ${getProgressColor()}`}
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className={`text-xs ${dark ? "text-white/40" : "text-neutral-400"}`}>
              {currency}0
            </Text>
            <Text className={`text-xs ${dark ? "text-white/40" : "text-neutral-400"}`}>
              {currency}{limit.toLocaleString()}
            </Text>
          </View>

          {/* Expense chips */}
          {expenses.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {expenses.map((e, i) => (
                <View
                  key={i}
                  className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                    dark ? "bg-white/15 border-white/10" : "bg-white/80 border-stone-100"
                  }`}
                >
                  <Text className={`text-xs font-medium ${dark ? "text-white/80" : "text-neutral-600"}`}>
                    {e.label}
                  </Text>
                  <Text className={`text-xs ${dark ? "text-white/50" : "text-neutral-400"}`}>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
});

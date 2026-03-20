import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInsightsData } from "@/hooks/use-insights-data";
import { useSettingsContext } from "@/components/providers/settings-provider";
import type { InsightsPeriod } from "@repo/shared/insights/types";

function PeriodToggle({
  period,
  onChange,
}: {
  period: InsightsPeriod;
  onChange: (p: InsightsPeriod) => void;
}) {
  return (
    <View className="flex-row bg-gray-100 rounded-lg p-1 mb-4">
      {(["week", "month"] as const).map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onChange(p)}
          className={`flex-1 py-2 rounded-md items-center ${
            period === p ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              period === p ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {p === "week" ? "Week" : "Month"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function InsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3">
      <Text className="text-xs text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function InsightsScreen() {
  const [period, setPeriod] = useState<InsightsPeriod>("month");
  const { settings } = useSettingsContext();
  const currency = settings.currency === "PHP" ? "₱" : settings.currency;

  const {
    isLoading,
    dailySpending,
    categoryBreakdown,
    streaks,
    periodTotals,
    monthComparison,
    weekdayWeekend,
    completeness,
    topDays,
    timeOfDay,
  } = useInsightsData(period);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">Loading insights...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="px-4 pt-2">
        <Text className="text-2xl font-bold mb-4">Insights</Text>

        <PeriodToggle period={period} onChange={setPeriod} />

        {/* Period Totals */}
        <InsightCard title={periodTotals.periodLabel}>
          <Text className="text-3xl font-bold mb-1">
            {currency}
            {periodTotals.total.toLocaleString()}
          </Text>
          <Text className="text-sm text-gray-500">
            {currency}
            {periodTotals.avg.toLocaleString()} avg/day
          </Text>
        </InsightCard>

        {/* Spending Trend (bar chart) */}
        <InsightCard title="Spending Trend">
          <View className="flex-row items-end justify-between h-24">
            {dailySpending.slice(-14).map((day) => {
              const maxAmt = Math.max(
                ...dailySpending.slice(-14).map((d) => d.amount),
                1
              );
              const height = Math.max((day.amount / maxAmt) * 80, 2);
              return (
                <View key={day.date} className="items-center flex-1 mx-0.5">
                  <View
                    className={`w-full rounded-t ${
                      day.isToday ? "bg-emerald-500" : "bg-emerald-200"
                    }`}
                    style={{ height }}
                  />
                </View>
              );
            })}
          </View>
        </InsightCard>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <InsightCard title="Categories">
            {categoryBreakdown.map((cat) => (
              <View key={cat.category} className="mb-2.5">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-700">{cat.category}</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {currency}
                    {cat.amount.toLocaleString()} ({cat.percentage}%)
                  </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </InsightCard>
        )}

        {/* Streak */}
        <InsightCard title="Streak">
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-3xl font-bold text-emerald-500">
                {streaks.current}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Current</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-3xl font-bold text-gray-300">
                {streaks.longest}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Best</Text>
            </View>
          </View>
          <Text className="text-xs text-gray-400 text-center mt-2">
            {streaks.type === "under_budget" ? "Days under budget" : "Days tracked"}
          </Text>
        </InsightCard>

        {/* Month Comparison */}
        {monthComparison && (
          <InsightCard title="Month Comparison">
            <View className="flex-row justify-between mb-2">
              <View>
                <Text className="text-xs text-gray-400">
                  {monthComparison.currentMonthLabel}
                </Text>
                <Text className="text-lg font-bold">
                  {currency}
                  {monthComparison.currentTotal.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-400">
                  {monthComparison.previousMonthLabel}
                </Text>
                <Text className="text-lg font-bold text-gray-400">
                  {currency}
                  {monthComparison.previousTotal.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text
              className={`text-sm font-medium ${
                monthComparison.delta > 0 ? "text-red-500" : "text-emerald-500"
              }`}
            >
              {monthComparison.delta > 0 ? "+" : ""}
              {monthComparison.percentChange}% vs last month
            </Text>
          </InsightCard>
        )}

        {/* Weekday vs Weekend */}
        <InsightCard title="Weekday vs Weekend">
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold">
                {currency}
                {weekdayWeekend.weekdayAvg.toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Weekday avg</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold">
                {currency}
                {weekdayWeekend.weekendAvg.toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Weekend avg</Text>
            </View>
          </View>
          {weekdayWeekend.higherOn !== "equal" && (
            <Text className="text-xs text-gray-500 text-center mt-2">
              {weekdayWeekend.percentDiff}% more on {weekdayWeekend.higherOn}s
            </Text>
          )}
        </InsightCard>

        {/* Tracking Completeness */}
        <InsightCard title="Tracking Completeness">
          <View className="items-center">
            <Text className="text-4xl font-bold text-emerald-500">
              {completeness.percentage}%
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              {completeness.trackedDays} of {completeness.totalDays} days tracked
            </Text>
          </View>
        </InsightCard>

        {/* Time of Day */}
        <InsightCard title="Time of Day">
          {timeOfDay.map((bucket) => (
            <View key={bucket.label} className="flex-row items-center mb-2">
              <Text className="w-20 text-xs text-gray-500">{bucket.label}</Text>
              <View className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden mx-2">
                <View
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${bucket.percentage}%` }}
                />
              </View>
              <Text className="text-xs text-gray-700 w-12 text-right">
                {bucket.percentage}%
              </Text>
            </View>
          ))}
        </InsightCard>

        {/* Top Spending Days */}
        {topDays.length > 0 && (
          <InsightCard title="Top Spending Days">
            {topDays.map((day, i) => (
              <View
                key={day.date}
                className="flex-row items-center justify-between py-2 border-b border-gray-50"
              >
                <View className="flex-row items-center">
                  <Text className="text-sm font-semibold text-gray-300 w-5">
                    {i + 1}
                  </Text>
                  <View className="ml-2">
                    <Text className="text-sm text-gray-700">{day.dateLabel}</Text>
                    {day.topExpense && (
                      <Text className="text-xs text-gray-400">
                        {day.topExpense.description}
                      </Text>
                    )}
                  </View>
                </View>
                <Text className="text-sm font-semibold">
                  {currency}
                  {day.total.toLocaleString()}
                </Text>
              </View>
            ))}
          </InsightCard>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

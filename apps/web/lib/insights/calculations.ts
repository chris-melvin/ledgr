import * as dateUtils from "@/lib/utils/date";
import type { Expense } from "@repo/database";
import type {
  DailySpending,
  CategoryTotal,
  DayOfWeekSpending,
  StreakInfo,
  PeriodTotals,
  InsightsPeriod,
  MonthComparison,
  WeekdayWeekendSplit,
  RollingAveragePoint,
  TrackingCompleteness,
  TrackingCalendarDay,
  TimeOfDayBucket,
  CumulativeSpendingPoint,
  TopSpendingDay,
  CategoryTrendWeek,
} from "./types";

const CATEGORY_COLORS = [
  "#1A9E9E", // teal
  "#E87356", // coral
  "#D4A843", // gold
  "#4A90D9", // blue
  "#5CB85C", // green
  "#8E6CB8", // purple
  "#D97BA0", // pink
  "#8C8C8C", // neutral
];

export function computeDailySpending(
  expenses: Expense[],
  timezone: string,
  days: number
): DailySpending[] {
  const now = new Date();
  const todayStr = dateUtils.formatInTimezone(now, timezone, "yyyy-MM-dd");

  // Build start/end timestamps
  const endTimestamp = dateUtils.getCurrentTimestamp(timezone, true);
  const startTimestamp = dateUtils.subtractDaysFromTimestamp(
    endTimestamp,
    days - 1,
    timezone
  );

  const dayKeys = dateUtils.getEachDayInInterval(startTimestamp, endTimestamp, timezone);

  // Group expenses by date key
  const spendByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    spendByDay.set(key, (spendByDay.get(key) ?? 0) + expense.amount);
  }

  return dayKeys.map((date) => ({
    date,
    amount: spendByDay.get(date) ?? 0,
    isToday: date === todayStr,
    overBudget: false, // will be set by caller if budget mode
  }));
}

export function computeCategoryBreakdown(
  expenses: Expense[]
): CategoryTotal[] {
  const categoryMap = new Map<string, number>();
  for (const expense of expenses) {
    const cat = expense.category || "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + expense.amount);
  }

  // Sort descending by amount
  const sorted = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const total = sorted.reduce((sum, [, amt]) => sum + amt, 0);

  // Group excess into "Other" if more than 6 categories
  let entries = sorted;
  if (sorted.length > 6) {
    const top6 = sorted.slice(0, 6);
    const otherAmount = sorted.slice(6).reduce((sum, [, amt]) => sum + amt, 0);
    entries = [...top6, ["Other", otherAmount] as [string, number]];
  }

  return entries.map(([category, amount], i) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
  }));
}

export function computeDayOfWeekSpending(
  expenses: Expense[],
  timezone: string
): DayOfWeekSpending[] {
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  // Track totals and unique dates per weekday
  const dayTotals = Array.from({ length: 7 }, () => 0);
  const dayDates = Array.from({ length: 7 }, () => new Set<string>());

  for (const expense of expenses) {
    const date = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    const dayOfWeek = new Date(date + "T12:00:00").getDay(); // noon to avoid DST issues
    dayTotals[dayOfWeek]! += expense.amount;
    dayDates[dayOfWeek]!.add(date);
  }

  return DAY_LABELS.map((label, i) => {
    const totalDays = Math.max(dayDates[i]!.size, 1);
    return {
      dayIndex: i,
      dayLabel: label,
      average: dayTotals[i]! / totalDays,
      totalDays: dayDates[i]!.size,
    };
  });
}

export function computeStreaks(
  expenses: Expense[],
  timezone: string,
  dailyLimit: number,
  isBudgetMode: boolean
): StreakInfo {
  const type = isBudgetMode ? "under_budget" : "tracking";

  // Build a map of date -> total spending
  const spendByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    spendByDay.set(key, (spendByDay.get(key) ?? 0) + expense.amount);
  }

  const todayStr = dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");

  // Walk backwards from today counting consecutive streak days
  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Check up to 90 days back
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(todayStr + "T12:00:00");
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = dateUtils.formatInTimezone(checkDate, timezone, "yyyy-MM-dd");
    const spent = spendByDay.get(dateKey) ?? 0;

    const passes = isBudgetMode ? spent <= dailyLimit : spent > 0;

    if (passes) {
      tempStreak++;
      if (i < 90) {
        // still building current streak
        current = tempStreak;
      }
    } else {
      if (i === 0) {
        // Today broke the streak, current is 0
        current = 0;
      }
      break;
    }
  }

  longest = current;

  // Continue scanning for longest streak
  let scanning = false;
  tempStreak = 0;
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(todayStr + "T12:00:00");
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = dateUtils.formatInTimezone(checkDate, timezone, "yyyy-MM-dd");
    const spent = spendByDay.get(dateKey) ?? 0;

    const passes = isBudgetMode ? spent <= dailyLimit : spent > 0;

    if (passes) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 0;
      scanning = true;
    }
  }

  return { current, longest, type };
}

export function computePeriodTotals(
  expenses: Expense[],
  period: InsightsPeriod,
  timezone: string,
  days: number
): PeriodTotals {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = days > 0 ? Math.round(total / days) : 0;

  const now = new Date();
  const periodLabel =
    period === "week"
      ? "This Week"
      : dateUtils.formatInTimezone(now, timezone, "MMMM");

  return { total, avg, periodLabel };
}

export function computeMonthComparison(
  expenses: Expense[],
  timezone: string
): MonthComparison | null {
  const now = new Date();
  const todayStr = dateUtils.formatInTimezone(now, timezone, "yyyy-MM-dd");
  const currentMonthStart = dateUtils.getStartOfMonth(now.toISOString(), timezone);
  const currentMonthStartStr = dateUtils.formatInTimezone(
    new Date(currentMonthStart),
    timezone,
    "yyyy-MM-dd"
  );

  // Days elapsed in current month (inclusive of today)
  const currentDays =
    Math.floor(
      (new Date(todayStr + "T12:00:00").getTime() -
        new Date(currentMonthStartStr + "T12:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Previous month: same number of days from start
  const prevMonthStart = dateUtils.subtractMonthsFromTimestamp(
    currentMonthStart,
    1,
    timezone
  );
  const prevMonthStartStr = dateUtils.formatInTimezone(
    new Date(prevMonthStart),
    timezone,
    "yyyy-MM-dd"
  );
  const prevEndDate = new Date(prevMonthStartStr + "T12:00:00");
  prevEndDate.setDate(prevEndDate.getDate() + currentDays - 1);
  const prevEndStr = dateUtils.formatInTimezone(prevEndDate, timezone, "yyyy-MM-dd");

  // Filter expenses into each window
  let currentTotal = 0;
  let previousTotal = 0;
  let hasPrevData = false;

  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    if (key >= currentMonthStartStr && key <= todayStr) {
      currentTotal += expense.amount;
    }
    if (key >= prevMonthStartStr && key <= prevEndStr) {
      previousTotal += expense.amount;
      hasPrevData = true;
    }
  }

  if (!hasPrevData) return null;

  const delta = currentTotal - previousTotal;
  const percentChange =
    previousTotal > 0 ? Math.round((delta / previousTotal) * 100) : 0;

  const currentMonthLabel = dateUtils.formatInTimezone(now, timezone, "MMMM");
  const previousMonthLabel = dateUtils.formatInTimezone(
    new Date(prevMonthStart),
    timezone,
    "MMMM"
  );

  return {
    currentTotal,
    previousTotal,
    currentDays,
    previousDays: currentDays,
    delta,
    percentChange,
    currentMonthLabel,
    previousMonthLabel,
  };
}

export function computeRollingAverage(
  dailySpending: DailySpending[],
  windowSize: number = 7
): RollingAveragePoint[] {
  return dailySpending.map((day, i) => {
    if (i < windowSize - 1) {
      return { date: day.date, average: null };
    }
    let sum = 0;
    for (let j = i - windowSize + 1; j <= i; j++) {
      sum += dailySpending[j]!.amount;
    }
    return { date: day.date, average: Math.round(sum / windowSize) };
  });
}

export function computeWeekdayWeekendSplit(
  expenses: Expense[],
  timezone: string
): WeekdayWeekendSplit {
  const weekdayDates = new Set<string>();
  const weekendDates = new Set<string>();
  let weekdayTotal = 0;
  let weekendTotal = 0;

  for (const expense of expenses) {
    const dateStr = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendTotal += expense.amount;
      weekendDates.add(dateStr);
    } else {
      weekdayTotal += expense.amount;
      weekdayDates.add(dateStr);
    }
  }

  const weekdayDays = Math.max(weekdayDates.size, 1);
  const weekendDays = Math.max(weekendDates.size, 1);
  const weekdayAvg = Math.round(weekdayTotal / weekdayDays);
  const weekendAvg = Math.round(weekendTotal / weekendDays);

  let higherOn: "weekday" | "weekend" | "equal";
  let percentDiff: number;
  if (weekdayAvg === weekendAvg) {
    higherOn = "equal";
    percentDiff = 0;
  } else if (weekendAvg > weekdayAvg) {
    higherOn = "weekend";
    percentDiff =
      weekdayAvg > 0 ? Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100) : 100;
  } else {
    higherOn = "weekday";
    percentDiff =
      weekendAvg > 0 ? Math.round(((weekdayAvg - weekendAvg) / weekendAvg) * 100) : 100;
  }

  return {
    weekdayAvg,
    weekendAvg,
    weekdayTotal,
    weekendTotal,
    weekdayDays: weekdayDates.size,
    weekendDays: weekendDates.size,
    higherOn,
    percentDiff,
  };
}

export function computeTrackingCompleteness(
  expenses: Expense[],
  timezone: string,
  days: number
): TrackingCompleteness {
  const endTimestamp = dateUtils.getCurrentTimestamp(timezone, true);
  const startTimestamp = dateUtils.subtractDaysFromTimestamp(endTimestamp, days - 1, timezone);
  const dayKeys = dateUtils.getEachDayInInterval(startTimestamp, endTimestamp, timezone);

  const trackedDates = new Set<string>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    trackedDates.add(key);
  }

  const missedDates: string[] = [];
  for (const day of dayKeys) {
    if (!trackedDates.has(day)) {
      missedDates.push(day);
    }
  }

  const trackedDays = dayKeys.length - missedDates.length;
  const percentage = dayKeys.length > 0 ? Math.round((trackedDays / dayKeys.length) * 100) : 0;

  return { trackedDays, totalDays: dayKeys.length, percentage, missedDates };
}

export function computeTrackingCalendar(
  expenses: Expense[],
  timezone: string
): TrackingCalendarDay[] {
  const CALENDAR_DAYS = 91; // 13 weeks
  const endTimestamp = dateUtils.getCurrentTimestamp(timezone, true);
  const startTimestamp = dateUtils.subtractDaysFromTimestamp(endTimestamp, CALENDAR_DAYS - 1, timezone);
  const dayKeys = dateUtils.getEachDayInInterval(startTimestamp, endTimestamp, timezone);

  const countByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  // Determine thresholds for levels
  const counts = dayKeys.map((d) => countByDay.get(d) ?? 0).filter((c) => c > 0);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  return dayKeys.map((date) => {
    const count = countByDay.get(date) ?? 0;
    let level: 0 | 1 | 2 | 3 | 4;
    if (count === 0) level = 0;
    else if (count <= maxCount * 0.25) level = 1;
    else if (count <= maxCount * 0.5) level = 2;
    else if (count <= maxCount * 0.75) level = 3;
    else level = 4;
    return { date, level, count };
  });
}

export function computeTimeOfDay(
  expenses: Expense[],
  timezone: string
): TimeOfDayBucket[] {
  const buckets = [
    { label: "Morning", range: "6am–12pm", count: 0, total: 0 },
    { label: "Afternoon", range: "12pm–5pm", count: 0, total: 0 },
    { label: "Evening", range: "5pm–9pm", count: 0, total: 0 },
    { label: "Night", range: "9pm–6am", count: 0, total: 0 },
  ];

  for (const expense of expenses) {
    const hourStr = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "HH"
    );
    const hour = parseInt(hourStr, 10);

    let idx: number;
    if (hour >= 6 && hour < 12) idx = 0;
    else if (hour >= 12 && hour < 17) idx = 1;
    else if (hour >= 17 && hour < 21) idx = 2;
    else idx = 3;

    buckets[idx]!.count++;
    buckets[idx]!.total += expense.amount;
  }

  const totalCount = buckets.reduce((s, b) => s + b.count, 0);

  return buckets.map((b) => ({
    ...b,
    percentage: totalCount > 0 ? Math.round((b.count / totalCount) * 100) : 0,
  }));
}

export function computeCumulativeSpending(
  expenses: Expense[],
  timezone: string
): CumulativeSpendingPoint[] {
  const now = new Date();
  const todayStr = dateUtils.formatInTimezone(now, timezone, "yyyy-MM-dd");
  const monthStart = dateUtils.getStartOfMonth(now.toISOString(), timezone);
  const monthStartStr = dateUtils.formatInTimezone(new Date(monthStart), timezone, "yyyy-MM-dd");

  // Get all days from month start to end of month (day 30 or actual month end)
  const startDate = new Date(monthStartStr + "T12:00:00");
  const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();

  // Group expenses by day
  const spendByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    if (key >= monthStartStr) {
      spendByDay.set(key, (spendByDay.get(key) ?? 0) + expense.amount);
    }
  }

  // Calculate today's day number (1-indexed)
  const todayDayNum = Math.floor(
    (new Date(todayStr + "T12:00:00").getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Build cumulative data
  let cumulative = 0;
  const totalSoFar = Array.from(spendByDay.values()).reduce((s, v) => s + v, 0);
  const dailyRate = todayDayNum > 0 ? totalSoFar / todayDayNum : 0;

  const points: CumulativeSpendingPoint[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + day - 1);
    const dateStr = dateUtils.formatInTimezone(d, timezone, "yyyy-MM-dd");
    const isPast = dateStr <= todayStr;

    if (isPast) {
      cumulative += spendByDay.get(dateStr) ?? 0;
      points.push({
        date: dateStr,
        day,
        actual: cumulative,
        projected: day === todayDayNum ? cumulative : null,
      });
    } else {
      points.push({
        date: dateStr,
        day,
        actual: null,
        projected: Math.round(dailyRate * day),
      });
    }
  }

  // Connect actual line to projected line
  if (todayDayNum > 0 && todayDayNum <= daysInMonth) {
    const todayPoint = points[todayDayNum - 1];
    if (todayPoint) {
      todayPoint.projected = todayPoint.actual;
    }
  }

  return points;
}

export function computeTopSpendingDays(
  expenses: Expense[],
  timezone: string,
  limit: number = 5
): TopSpendingDay[] {
  const dayMap = new Map<string, { total: number; expenses: Expense[] }>();

  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    const entry = dayMap.get(key) ?? { total: 0, expenses: [] };
    entry.total += expense.amount;
    entry.expenses.push(expense);
    dayMap.set(key, entry);
  }

  return Array.from(dayMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([date, data]) => {
      const d = new Date(date + "T12:00:00");
      const dateLabel = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const topExpense = data.expenses.sort((a, b) => b.amount - a.amount)[0];
      return {
        date,
        dateLabel,
        total: data.total,
        topExpense: topExpense
          ? { description: topExpense.label || topExpense.category || "Expense", amount: topExpense.amount }
          : null,
      };
    });
}

export function computeCategoryTrends(
  expenses: Expense[],
  timezone: string,
  weeks: number = 4
): { weeks: CategoryTrendWeek[]; categories: string[] } {
  const now = new Date();
  const todayStr = dateUtils.formatInTimezone(now, timezone, "yyyy-MM-dd");

  // Build week boundaries
  const weekBoundaries: { start: string; end: string; label: string }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const endDate = new Date(todayStr + "T12:00:00");
    endDate.setDate(endDate.getDate() - w * 7);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    weekBoundaries.push({
      start: dateUtils.formatInTimezone(startDate, timezone, "yyyy-MM-dd"),
      end: dateUtils.formatInTimezone(endDate, timezone, "yyyy-MM-dd"),
      label: `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    });
  }

  // Count category totals across all expenses to find top 5
  const globalCatTotals = new Map<string, number>();
  for (const expense of expenses) {
    const cat = expense.category || "Uncategorized";
    globalCatTotals.set(cat, (globalCatTotals.get(cat) ?? 0) + expense.amount);
  }
  const sortedCats = Array.from(globalCatTotals.entries())
    .sort((a, b) => b[1] - a[1]);
  const topCategories = sortedCats.slice(0, 5).map(([c]) => c);
  const hasOther = sortedCats.length > 5;

  // Build week data
  const weekData: CategoryTrendWeek[] = weekBoundaries.map((wb) => {
    const categories: Record<string, number> = {};
    for (const cat of topCategories) categories[cat] = 0;
    if (hasOther) categories["Other"] = 0;

    for (const expense of expenses) {
      const key = dateUtils.formatInTimezone(
        new Date(expense.occurred_at),
        timezone,
        "yyyy-MM-dd"
      );
      if (key >= wb.start && key <= wb.end) {
        const cat = expense.category || "Uncategorized";
        if (topCategories.includes(cat)) {
          categories[cat] = (categories[cat] ?? 0) + expense.amount;
        } else if (hasOther) {
          categories["Other"] = (categories["Other"] ?? 0) + expense.amount;
        }
      }
    }

    return { weekLabel: wb.label, startDate: wb.start, categories };
  });

  const allCats = hasOther ? [...topCategories, "Other"] : topCategories;
  return { weeks: weekData, categories: allCats };
}

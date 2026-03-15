export type InsightsPeriod = "week" | "month";

export interface DailySpending {
  date: string; // YYYY-MM-DD
  amount: number;
  isToday: boolean;
  overBudget: boolean;
}

export interface CategoryTotal {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DayOfWeekSpending {
  dayIndex: number; // 0 (Sun) - 6 (Sat)
  dayLabel: string;
  average: number;
  totalDays: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  type: "under_budget" | "tracking";
}

export interface PeriodTotals {
  total: number;
  avg: number;
  periodLabel: string;
}

export interface MonthComparison {
  currentTotal: number;
  previousTotal: number;
  currentDays: number;
  previousDays: number;
  delta: number;
  percentChange: number;
  currentMonthLabel: string;
  previousMonthLabel: string;
}

export interface WeekdayWeekendSplit {
  weekdayAvg: number;
  weekendAvg: number;
  weekdayTotal: number;
  weekendTotal: number;
  weekdayDays: number;
  weekendDays: number;
  higherOn: "weekday" | "weekend" | "equal";
  percentDiff: number;
}

export interface RollingAveragePoint {
  date: string;
  average: number | null;
}

export interface TrackingCompleteness {
  trackedDays: number;
  totalDays: number;
  percentage: number;
  missedDates: string[]; // YYYY-MM-DD
}

export interface TrackingCalendarDay {
  date: string; // YYYY-MM-DD
  level: 0 | 1 | 2 | 3 | 4; // activity intensity
  count: number;
}

export interface TimeOfDayBucket {
  label: string;
  range: string;
  count: number;
  total: number;
  percentage: number;
}

export interface CumulativeSpendingPoint {
  date: string;
  day: number;
  actual: number | null;
  projected: number | null;
}

export interface TopSpendingDay {
  date: string;
  dateLabel: string;
  total: number;
  topExpense: { description: string; amount: number } | null;
}

export interface CategoryTrendWeek {
  weekLabel: string;
  startDate: string;
  categories: Record<string, number>;
}

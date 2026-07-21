export type InsightsPeriod = "week" | "month";

export interface DailySpending {
  date: string;
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
  dayIndex: number;
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
  missedDates: string[];
}

export interface TrackingCalendarDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
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

// ─── Tracking-mode insights (spending-clarity) ──────────────────────────────

export interface BalanceTrendPoint {
  date: string; // yyyy-MM-dd local
  balance: number;
  isToday: boolean;
  /** True for forward-projected (forecast) points rather than actual history */
  projected?: boolean;
}

export interface BucketTotal {
  bucketId: string | null;
  name: string;
  slug: string;
  color: string;
  total: number;
  percentage: number;
  count: number;
}

// ─── Funding flow (runway-forecast) ─────────────────────────────────────────

export interface FundingFlow {
  /** Money added in the period (income + savings withdrawals) */
  added: number;
  /** Expenses spent in the period */
  spent: number;
  /** added − spent */
  net: number;
  /** Number of top-up events in the period */
  topUpCount: number;
  /** Average size of a top-up */
  avgTopUp: number;
  /** Average days between top-ups; null with fewer than 2 top-ups */
  cadenceDays: number | null;
}

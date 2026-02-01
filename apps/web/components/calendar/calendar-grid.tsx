"use client";

import { useMemo, useState } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { CalendarNav } from "./calendar-nav";
import { CalendarDayCell } from "./calendar-day";
import { daysInMonth, firstDayOfMonth } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT } from "@/lib/constants";
import type { CalendarDay, LocalIncome, LocalBill, BucketSpendingSummary } from "@/lib/types";
import type { Expense, BudgetBucket } from "@repo/database";

// Short weekday labels for mobile
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  expenses: Expense[];
  incomes?: LocalIncome[];
  bills?: LocalBill[];
  buckets?: BudgetBucket[];
  onDayClick: (date: Date) => void;
  selectedDate?: Date | null;
}

/**
 * Calendar grid component with timezone-aware date handling
 *
 * Updated to use Expense type with occurred_at timestamps
 */
export function CalendarGrid({ expenses, incomes = [], bills = [], buckets = [], onDayClick, selectedDate }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { timezone } = useTimezone();

  // Debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("[CalendarGrid] Data received:", {
      expensesCount: expenses.length,
      incomesCount: incomes.length,
      billsCount: bills.length,
      bucketsCount: buckets.length,
      expenses: expenses.slice(0, 3),
      incomes: incomes.slice(0, 3),
      bills: bills.slice(0, 3),
      buckets: buckets.map(b => ({ id: b.id, slug: b.slug, name: b.name, color: b.color })),
    });
  }

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days: CalendarDay[] = [];

    // Find the daily-spending bucket for status color calculation
    const dailySpendingBucket = buckets.find((b) => b.slug === "daily-spending");
    const dailySpendingId = dailySpendingBucket?.id;

    // Create bucket lookup map for efficiency
    const bucketMap = new Map(buckets.map((b) => [b.id, b]));

    // Filter expenses for current month in user's timezone
    const monthExpenses = expenses.filter((e) => {
      const expenseDate = dateUtils.toUserDate(e.occurred_at, timezone);
      return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    });

    // Pad beginning of month
    for (let i = 0; i < startOffset; i++) {
      days.push({
        day: 0,
        date: new Date(),
        key: `padding-${i}`,
        limit: 0,
        spent: 0,
        remaining: 0,
        isPadding: true,
      });
    }

    // Generate month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const key = dateUtils.formatInTimezone(dateObj, timezone, "yyyy-MM-dd");

      // Get all expenses for this day in user's timezone
      const dayExpenses = monthExpenses.filter((e) => {
        const expenseDateStr = dateUtils.formatInTimezone(new Date(e.occurred_at), timezone, "yyyy-MM-dd");
        return expenseDateStr === key;
      });

      // Calculate total spent (all buckets - for display)
      const spent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Calculate daily-spending only (for status color)
      // Expenses with no bucket_id are treated as daily-spending
      const dailySpendingSpent = dayExpenses
        .filter((e) => !e.bucket_id || e.bucket_id === dailySpendingId)
        .reduce((sum, e) => sum + e.amount, 0);

      const limit = DEFAULT_DAILY_LIMIT;
      // Remaining is based on daily spending only (bucket-aware)
      const remaining = limit - dailySpendingSpent;

      // Group expenses by bucket for visual summary
      const bucketGroups = new Map<string, { amount: number; count: number }>();
      dayExpenses.forEach((e) => {
        const bucketId = e.bucket_id || "uncategorized";
        const existing = bucketGroups.get(bucketId) || { amount: 0, count: 0 };
        bucketGroups.set(bucketId, {
          amount: existing.amount + e.amount,
          count: existing.count + 1,
        });
      });

      // Build bucket summary array
      const bucketSummary: BucketSpendingSummary[] = [];
      bucketGroups.forEach((data, bucketId) => {
        if (bucketId === "uncategorized") {
          // Treat uncategorized as daily-spending visually
          if (dailySpendingBucket) {
            bucketSummary.push({
              bucketId: dailySpendingBucket.id,
              bucketSlug: dailySpendingBucket.slug,
              bucketName: dailySpendingBucket.name,
              bucketColor: dailySpendingBucket.color || "#1A9E9E",
              amount: data.amount,
              transactionCount: data.count,
            });
          } else {
            bucketSummary.push({
              bucketId: "uncategorized",
              bucketSlug: "uncategorized",
              bucketName: "Uncategorized",
              bucketColor: "#78716c",
              amount: data.amount,
              transactionCount: data.count,
            });
          }
        } else {
          const bucket = bucketMap.get(bucketId);
          if (bucket) {
            bucketSummary.push({
              bucketId: bucket.id,
              bucketSlug: bucket.slug,
              bucketName: bucket.name,
              bucketColor: bucket.color || "#78716c",
              amount: data.amount,
              transactionCount: data.count,
            });
          }
        }
      });

      // Sort by amount descending for consistent dot ordering
      bucketSummary.sort((a, b) => b.amount - a.amount);

      // Check for income on this day
      const dayIncomes = incomes.filter((inc) => inc.dayOfMonth === d);
      const incomeAmount = dayIncomes.reduce((sum, inc) => sum + inc.amount, 0);

      // Check for bills on this day (use dueDayOfMonth for recurring, or parse dueDate)
      const dayBills = bills.filter((bill) => {
        // For recurring bills, use dueDayOfMonth
        if (bill.dueDayOfMonth) {
          return bill.dueDayOfMonth === d;
        }
        // For specific date bills, parse the ISO date
        if (bill.dueDate) {
          const billDate = new Date(bill.dueDate);
          return billDate.getDate() === d &&
                 billDate.getMonth() === month &&
                 billDate.getFullYear() === year;
        }
        return false;
      });
      const billAmount = dayBills.reduce((sum, bill) => sum + bill.amount, 0);
      const billLabel = dayBills.length > 0 ? dayBills[0]?.label : undefined;

      const dayData = {
        day: d,
        date: dateObj,
        key,
        limit,
        spent,
        remaining,
        dailySpendingSpent,
        transactionCount: dayExpenses.length,
        bucketSummary: bucketSummary.length > 0 ? bucketSummary : undefined,
        hasIncome: dayIncomes.length > 0,
        incomeAmount: incomeAmount > 0 ? incomeAmount : undefined,
        hasBill: dayBills.length > 0,
        billAmount: billAmount > 0 ? billAmount : undefined,
        billLabel,
      };

      // Debug logging for days with data
      if (process.env.NODE_ENV === "development" && (dayExpenses.length > 0 || dayIncomes.length > 0 || dayBills.length > 0)) {
        console.log(`[CalendarGrid] Day ${d} data:`, {
          key,
          hasExpenses: dayExpenses.length > 0,
          hasIncome: dayIncomes.length > 0,
          hasBill: dayBills.length > 0,
          bucketSummary: dayData.bucketSummary,
          dayData,
        });
      }

      days.push(dayData);
    }

    if (process.env.NODE_ENV === "development") {
      const daysWithData = days.filter(d => !d.isPadding && (d.spent > 0 || d.hasIncome || d.hasBill));
      console.log(`[CalendarGrid] Generated ${days.length} days, ${daysWithData.length} with data:`, daysWithData);
    }

    return days;
  }, [currentDate, expenses, incomes, bills, buckets, timezone]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl sm:rounded-[2rem] shadow-sm overflow-hidden">
      <CalendarNav
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Weekday headers - compact on mobile */}
      <div className="grid grid-cols-7 text-center border-b border-stone-50">
        {WEEKDAYS_FULL.map((day, i) => (
          <div
            key={day}
            className="py-2 sm:py-4 text-[10px] font-bold text-stone-300 uppercase tracking-wider sm:tracking-[0.2em]"
          >
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid - Square aspect ratio cells */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const isSelected = selectedDate && !day.isPadding
            ? dateUtils.formatInTimezone(selectedDate, timezone, "yyyy-MM-dd") ===
              dateUtils.formatInTimezone(day.date, timezone, "yyyy-MM-dd")
            : false;
          return (
            <CalendarDayCell
              key={day.key}
              day={day}
              onClick={() => !day.isPadding && onDayClick(day.date)}
              isSelected={isSelected}
            />
          );
        })}
      </div>
    </div>
  );
}

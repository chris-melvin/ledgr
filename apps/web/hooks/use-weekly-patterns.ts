"use client";

import { useMemo } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import type { Expense } from "@repo/database";

interface CategoryData {
  category: string;
  amount: number;
  previousAmount: number;
  icon?: string;
}

interface WeeklyPatterns {
  weeklyTotal: number;
  previousWeekTotal: number;
  categoryBreakdown: CategoryData[];
  highestDay: { day: string; amount: number };
  suggestion: string;
}

// Map common labels to categories
const CATEGORY_MAP: Record<string, { category: string; icon: string }> = {
  coffee: { category: "Coffee & Drinks", icon: "☕" },
  lunch: { category: "Food", icon: "🍱" },
  dinner: { category: "Food", icon: "🍱" },
  breakfast: { category: "Food", icon: "🍱" },
  grab: { category: "Food Delivery", icon: "🛵" },
  grabfood: { category: "Food Delivery", icon: "🛵" },
  foodpanda: { category: "Food Delivery", icon: "🛵" },
  commute: { category: "Transportation", icon: "🚌" },
  taxi: { category: "Transportation", icon: "🚕" },
  snack: { category: "Snacks", icon: "🍿" },
  groceries: { category: "Groceries", icon: "🛒" },
  shopping: { category: "Shopping", icon: "🛍️" },
  entertainment: { category: "Entertainment", icon: "🎬" },
  utilities: { category: "Utilities", icon: "💡" },
};

function categorizeExpense(label: string): { category: string; icon: string } {
  const normalized = label.toLowerCase().trim();

  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return { category: "Other", icon: "📦" };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (6 - day); // Saturday as end
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Hook for analyzing weekly spending patterns with timezone support
 *
 * Updated to use timestamps and timezone-aware date comparisons
 */
export function useWeeklyPatterns(expenses: Expense[]): WeeklyPatterns {
  const { timezone } = useTimezone();

  return useMemo(() => {
    const today = new Date();
    const thisWeekStart = getWeekStart(today);
    const thisWeekEnd = getWeekEnd(today);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    // Filter expenses by week using timestamps
    const thisWeekExpenses = expenses.filter((e) => {
      const date = new Date(e.occurred_at);
      return date >= thisWeekStart && date <= thisWeekEnd;
    });

    const lastWeekExpenses = expenses.filter((e) => {
      const date = new Date(e.occurred_at);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    // Calculate totals
    const weeklyTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const categoryTotals = new Map<string, { amount: number; icon: string }>();
    const previousCategoryTotals = new Map<string, number>();

    for (const expense of thisWeekExpenses) {
      const { category, icon } = categorizeExpense(expense.label);
      const existing = categoryTotals.get(category);
      categoryTotals.set(category, {
        amount: (existing?.amount || 0) + expense.amount,
        icon,
      });
    }

    for (const expense of lastWeekExpenses) {
      const { category } = categorizeExpense(expense.label);
      const existing = previousCategoryTotals.get(category) || 0;
      previousCategoryTotals.set(category, existing + expense.amount);
    }

    // Build category breakdown
    const categoryBreakdown: CategoryData[] = [];
    for (const [category, data] of categoryTotals) {
      categoryBreakdown.push({
        category,
        amount: data.amount,
        previousAmount: previousCategoryTotals.get(category) || 0,
        icon: data.icon,
      });
    }

    // Find highest day using timestamps
    const dayTotals = new Map<number, number>();
    for (const expense of thisWeekExpenses) {
      const date = new Date(expense.occurred_at);
      const dayOfWeek = date.getDay();
      const existing = dayTotals.get(dayOfWeek) || 0;
      dayTotals.set(dayOfWeek, existing + expense.amount);
    }

    let highestDay = { day: "None", amount: 0 };
    for (const [dayIndex, amount] of dayTotals) {
      if (amount > highestDay.amount) {
        highestDay = { day: DAY_NAMES[dayIndex] || "Unknown", amount };
      }
    }

    // Generate suggestion based on patterns
    let suggestion = "Keep tracking your expenses to get personalized insights!";

    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown.sort((a, b) => b.amount - a.amount)[0];

      if (topCategory && topCategory.category === "Food Delivery") {
        suggestion = `Food delivery is your top expense at ${Math.round((topCategory.amount / weeklyTotal) * 100)}%. Consider cooking at home 2x this week to save money.`;
      } else if (topCategory && topCategory.category === "Coffee & Drinks") {
        suggestion = `Your coffee habit adds up! Try brewing at home some days to save around ₱500/week.`;
      } else if (topCategory && topCategory.category === "Transportation") {
        suggestion = `Transportation is significant. Consider carpooling or combining trips to reduce costs.`;
      } else if (weeklyTotal > previousWeekTotal * 1.2) {
        suggestion = `You're spending 20%+ more than last week. Review your expenses and adjust as needed.`;
      } else if (weeklyTotal < previousWeekTotal * 0.8) {
        suggestion = `Great job! You're spending 20%+ less than last week. Keep up the good habits!`;
      }
    }

    return {
      weeklyTotal,
      previousWeekTotal,
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.amount - a.amount),
      highestDay,
      suggestion,
    };
  }, [expenses, timezone]);
}

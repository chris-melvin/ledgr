"use client";

import { useState, useCallback } from "react";
import { formatKey } from "@/lib/utils";
import type { LocalExpense } from "@/lib/types";

export function useExpenses() {
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);

  const addExpense = useCallback((date: Date, amount: number, label: string) => {
    const timestamp = date.toISOString();
    const newExpense: LocalExpense = {
      id: crypto.randomUUID(),
      occurred_at: timestamp,
      amount,
      label,
    };
    setExpenses((prev) => [...prev, newExpense]);
    return newExpense;
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getExpensesForDate = useCallback(
    (date: Date) => {
      const key = formatKey(date);
      return expenses.filter((e) => formatKey(new Date(e.occurred_at)) === key);
    },
    [expenses]
  );

  const getTotalForDate = useCallback(
    (date: Date) => {
      return getExpensesForDate(date).reduce((sum, e) => sum + e.amount, 0);
    },
    [getExpensesForDate]
  );

  return {
    expenses,
    addExpense,
    removeExpense,
    getExpensesForDate,
    getTotalForDate,
  };
}

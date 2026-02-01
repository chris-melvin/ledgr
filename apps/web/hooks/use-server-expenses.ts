"use client";

import { useOptimistic, useTransition, useCallback } from "react";
import {
  createExpenseFromData,
  updateExpenseFromData,
  deleteExpense as deleteExpenseAction,
} from "@/actions/expenses";
import type { Expense } from "@repo/database";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

/**
 * Optimistic expense with pending state
 */
interface OptimisticExpense extends Expense {
  pending?: boolean;
}

type OptimisticAction =
  | { type: "add"; expense: OptimisticExpense }
  | { type: "add_many"; expenses: OptimisticExpense[] }
  | { type: "delete"; id: string }
  | { type: "update"; id: string; data: Partial<Expense> };

/**
 * Hook for managing expenses with server actions and optimistic updates
 *
 * Updated to use timestamps exclusively
 */
export function useServerExpenses(initialExpenses: Expense[]) {
  const [isPending, startTransition] = useTransition();
  const { timezone } = useTimezone();

  // Optimistic state reducer
  const [optimisticExpenses, setOptimisticExpenses] = useOptimistic<
    OptimisticExpense[],
    OptimisticAction
  >(initialExpenses, (state, action) => {
    switch (action.type) {
      case "add":
        return [...state, action.expense];
      case "add_many":
        return [...state, ...action.expenses];
      case "delete":
        return state.filter((e) => e.id !== action.id);
      case "update":
        return state.map((e) =>
          e.id === action.id ? { ...e, ...action.data } : e
        );
      default:
        return state;
    }
  });

  /**
   * Add a single expense with optimistic update
   *
   * @param occurredAt - Timestamp when expense occurred (ISO 8601)
   * @param amount - Expense amount
   * @param label - Expense label
   * @param options - Optional category and bucket
   */
  const addExpense = useCallback(
    async (
      occurredAt: string,
      amount: number,
      label: string,
      options?: { category?: string; bucketId?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimisticExpense: OptimisticExpense = {
        id: tempId,
        user_id: "", // Will be set by server
        occurred_at: occurredAt,
        amount,
        label,
        category: options?.category ?? null,
        category_id: null,
        notes: null,
        recurring_expense_id: null,
        bucket_id: options?.bucketId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pending: true,
      };

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        // Apply optimistic update
        setOptimisticExpenses({ type: "add", expense: optimisticExpense });

        // Execute server action
        const serverResult = await createExpenseFromData({
          occurred_at: occurredAt,
          amount,
          label,
          category: options?.category ?? null,
          bucket_id: options?.bucketId ?? null,
        });

        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to create expense:", serverResult.error);
          // Rollback happens automatically when revalidation occurs
        }
      });

      return result;
    },
    [setOptimisticExpenses]
  );

  /**
   * Add multiple expenses with optimistic update (for AI parser batch add)
   *
   * @param expenses - Array of expenses to add
   * @param occurredAt - Timestamp when expenses occurred (defaults to now)
   */
  const addExpenses = useCallback(
    async (
      expenses: Array<{ amount: number; label: string; category?: string; bucketId?: string }>,
      occurredAt: string = dateUtils.getCurrentTimestamp(timezone)
    ): Promise<{ success: boolean; errors: string[] }> => {
      const errors: string[] = [];

      const optimisticExpenses: OptimisticExpense[] = expenses.map(
        (exp, index) => ({
          id: `temp-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
          user_id: "",
          occurred_at: occurredAt,
          amount: exp.amount,
          label: exp.label,
          category: exp.category ?? null,
          category_id: null,
          notes: null,
          recurring_expense_id: null,
          bucket_id: exp.bucketId ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pending: true,
        })
      );

      startTransition(async () => {
        // Apply optimistic update for all
        setOptimisticExpenses({ type: "add_many", expenses: optimisticExpenses });

        // Execute server actions for each expense
        const results = await Promise.all(
          expenses.map((exp) =>
            createExpenseFromData({
              occurred_at: occurredAt,
              amount: exp.amount,
              label: exp.label,
              category: exp.category ?? null,
              bucket_id: exp.bucketId ?? null,
            })
          )
        );

        // Collect errors
        results.forEach((result, index) => {
          if (!result.success) {
            errors.push(`${expenses[index]?.label}: ${result.error}`);
          }
        });
      });

      return { success: errors.length === 0, errors };
    },
    [setOptimisticExpenses]
  );

  /**
   * Delete an expense with optimistic update
   */
  const removeExpense = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      // Don't delete temp expenses (they're still being created)
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot delete pending expense" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        // Apply optimistic delete
        setOptimisticExpenses({ type: "delete", id });

        // Execute server action
        const serverResult = await deleteExpenseAction(id);

        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to delete expense:", serverResult.error);
          // Rollback happens automatically when revalidation occurs
        }
      });

      return result;
    },
    [setOptimisticExpenses]
  );

  /**
   * Update an expense with optimistic update
   */
  const updateExpense = useCallback(
    async (
      id: string,
      updates: { category?: string | null; bucket_id?: string | null }
    ): Promise<{ success: boolean; error?: string }> => {
      // Don't update temp expenses (they're still being created)
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending expense" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        // Apply optimistic update
        setOptimisticExpenses({ type: "update", id, data: updates });

        // Execute server action
        const serverResult = await updateExpenseFromData(id, updates);

        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to update expense:", serverResult.error);
          // Rollback happens automatically when revalidation occurs
        }
      });

      return result;
    },
    [setOptimisticExpenses]
  );

  /**
   * Get expenses for a specific date
   *
   * Uses occurred_at timestamp for filtering, comparing in user's timezone
   */
  const getExpensesForDate = useCallback(
    (date: Date): OptimisticExpense[] => {
      const targetDate = dateUtils.toDateString(date.toISOString(), timezone);
      return optimisticExpenses.filter((e) => {
        const expenseDate = dateUtils.toDateString(e.occurred_at, timezone);
        return expenseDate === targetDate;
      });
    },
    [optimisticExpenses, timezone]
  );

  /**
   * Get total spent for a specific date
   */
  const getTotalForDate = useCallback(
    (date: Date): number => {
      return getExpensesForDate(date).reduce((sum, e) => sum + e.amount, 0);
    },
    [getExpensesForDate]
  );

  return {
    expenses: optimisticExpenses,
    addExpense,
    addExpenses,
    updateExpense,
    removeExpense,
    getExpensesForDate,
    getTotalForDate,
    isPending,
  };
}

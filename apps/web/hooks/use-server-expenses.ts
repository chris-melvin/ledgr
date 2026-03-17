"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createExpenseFromData } from "@/actions/expenses/create";
import { updateExpenseFromData } from "@/actions/expenses/update";
import { deleteExpense as deleteExpenseAction } from "@/actions/expenses/delete";
import type { Expense } from "@repo/database";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { toast } from "sonner";

/**
 * Hook for managing expenses with server actions and optimistic updates.
 *
 * Uses useState + useEffect sync pattern. Server actions are called directly
 * (no startTransition) since isPending is unused by consumers.
 */
export function useServerExpenses(initialExpenses: Expense[]) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const router = useRouter();
  const { timezone } = useTimezone();

  // Sync from server after revalidation delivers new initialExpenses
  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  /**
   * Add multiple expenses with optimistic update (for AI parser batch add)
   */
  const addExpenses = useCallback(
    async (
      items: Array<{
        amount: number;
        label: string;
        category?: string;
        bucketId?: string;
      }>,
      occurredAt: string = dateUtils.getCurrentTimestamp(timezone)
    ): Promise<{ success: boolean; errors: string[] }> => {
      const errors: string[] = [];

      // Build optimistic entries
      const optimistic: Expense[] = items.map((exp, index) => ({
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
      }));

      // Optimistic append — immediate UI update
      setExpenses((prev) => [...prev, ...optimistic]);

      // Call server actions directly
      try {
        const results = await Promise.all(
          items.map((exp) =>
            createExpenseFromData({
              occurred_at: occurredAt,
              amount: exp.amount,
              label: exp.label,
              category: exp.category ?? null,
              bucket_id: exp.bucketId ?? null,
            })
          )
        );

        results.forEach((result, index) => {
          if (!result.success) {
            errors.push(`${items[index]?.label}: ${result.error}`);
          }
        });
      } catch (err) {
        console.error("[addExpenses] Server action threw:", err);
        errors.push("Failed to save expenses");
      }

      if (errors.length > 0) {
        toast.error(errors.join(", "));
      }

      // Deferred refresh — lets optimistic UI render before RSC re-fetch
      setTimeout(() => router.refresh(), 0);

      return { success: errors.length === 0, errors };
    },
    [timezone, router]
  );

  /**
   * Delete an expense with optimistic update
   */
  const removeExpense = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot delete pending expense" };
      }

      // Optimistic remove — immediate UI update
      setExpenses((prev) => prev.filter((e) => e.id !== id));

      try {
        const result = await deleteExpenseAction(id);
        if (!result.success) {
          console.error("Failed to delete expense:", result.error);
          toast.error(`Failed to delete: ${result.error}`);
          return { success: false, error: result.error };
        }
      } catch (err) {
        console.error("[removeExpense] Server action threw:", err);
        toast.error("Failed to delete expense");
        return { success: false, error: "Failed to delete expense" };
      }

      setTimeout(() => router.refresh(), 0);

      return { success: true };
    },
    [router]
  );

  /**
   * Update an expense with optimistic update
   */
  const updateExpense = useCallback(
    async (
      id: string,
      updates: {
        category?: string | null;
        bucket_id?: string | null;
        amount?: number;
        label?: string;
        notes?: string | null;
        occurred_at?: string;
      }
    ): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending expense" };
      }

      // Optimistic update — immediate UI update
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      try {
        const result = await updateExpenseFromData(id, updates);
        if (!result.success) {
          console.error("Failed to update expense:", result.error);
          toast.error(`Failed to update: ${result.error}`);
          return { success: false, error: result.error };
        }
      } catch (err) {
        console.error("[updateExpense] Server action threw:", err);
        toast.error("Failed to update expense");
        return { success: false, error: "Failed to update expense" };
      }

      setTimeout(() => router.refresh(), 0);

      return { success: true };
    },
    [router]
  );

  return {
    expenses,
    addExpenses,
    updateExpense,
    removeExpense,
  };
}

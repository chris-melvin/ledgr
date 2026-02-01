"use client";

import { useOptimistic, useTransition, useCallback } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import {
  createIncome as createIncomeAction,
  updateIncome as updateIncomeAction,
  deleteIncome as deleteIncomeAction,
  markIncomeReceived as markIncomeReceivedAction,
  resetIncomeStatus as resetIncomeStatusAction,
} from "@/actions/income";
import {
  createBill as createBillAction,
  updateBill as updateBillAction,
  deleteBill as deleteBillAction,
  markBillPaid as markBillPaidAction,
  resetBillStatus as resetBillStatusAction,
  makeDebtPayment as makeDebtPaymentAction,
} from "@/actions/bills";
import { recordDebtPayment as recordDebtPaymentAction } from "@/actions/bills/record-payment";
import type { Income, Debt } from "@repo/database";
import type { CreateIncomeInput, UpdateIncomeInput } from "@/lib/validations/income.schema";
import type { CreateBillInput, UpdateBillInput } from "@/lib/validations/bill.schema";

/**
 * Optimistic types with pending state
 */
export interface OptimisticIncome extends Income {
  pending?: boolean;
}

export interface OptimisticDebt extends Debt {
  pending?: boolean;
}

type IncomeAction =
  | { type: "add"; income: OptimisticIncome }
  | { type: "delete"; id: string }
  | { type: "update"; id: string; data: Partial<Income> };

type DebtAction =
  | { type: "add"; debt: OptimisticDebt }
  | { type: "delete"; id: string }
  | { type: "update"; id: string; data: Partial<Debt> };

interface UseServerBudgetOptions {
  incomes: Income[];
  bills: Debt[];
}

/**
 * Hook for managing budget items (incomes, bills, debts, subscriptions) with optimistic updates
 *
 * Updated to use timestamps exclusively
 */
export function useServerBudget({ incomes: initialIncomes, bills: initialBills }: UseServerBudgetOptions) {
  const [isPending, startTransition] = useTransition();
  const { timezone } = useTimezone();

  // Optimistic state for incomes
  const [optimisticIncomes, setOptimisticIncomes] = useOptimistic<
    OptimisticIncome[],
    IncomeAction
  >(initialIncomes, (state, action) => {
    switch (action.type) {
      case "add":
        return [...state, action.income];
      case "delete":
        return state.filter((i) => i.id !== action.id);
      case "update":
        return state.map((i) =>
          i.id === action.id ? { ...i, ...action.data } : i
        );
      default:
        return state;
    }
  });

  // Optimistic state for bills (includes bills, debts, subscriptions)
  const [optimisticBills, setOptimisticBills] = useOptimistic<
    OptimisticDebt[],
    DebtAction
  >(initialBills, (state, action) => {
    switch (action.type) {
      case "add":
        return [...state, action.debt];
      case "delete":
        return state.filter((b) => b.id !== action.id);
      case "update":
        return state.map((b) =>
          b.id === action.id ? { ...b, ...action.data } : b
        );
      default:
        return state;
    }
  });

  // ================== INCOME OPERATIONS ==================

  /**
   * Add a new income with optimistic update
   */
  const addIncome = useCallback(
    async (data: CreateIncomeInput): Promise<{ success: boolean; error?: string }> => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = dateUtils.getCurrentTimestamp(timezone);

      const optimisticIncome: OptimisticIncome = {
        id: tempId,
        user_id: "",
        label: data.label,
        amount: data.amount,
        day_of_month: data.day_of_month ?? null,
        frequency: data.frequency ?? "monthly",
        day_of_week: data.day_of_week ?? null,
        start_timestamp: data.start_timestamp ?? null,
        end_timestamp: data.end_timestamp ?? null,
        expected_timestamp: data.expected_timestamp ?? null,
        received_timestamp: null,
        is_active: data.is_active ?? true,
        status: "expected",
        created_at: now,
        updated_at: now,
        pending: true,
      };

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticIncomes({ type: "add", income: optimisticIncome });

        const serverResult = await createIncomeAction(data);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to create income:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticIncomes, timezone]
  );

  /**
   * Update an income with optimistic update
   */
  const updateIncome = useCallback(
    async (id: string, data: UpdateIncomeInput): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending income" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticIncomes({ type: "update", id, data });

        const serverResult = await updateIncomeAction(id, data);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to update income:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticIncomes]
  );

  /**
   * Delete an income with optimistic update
   */
  const deleteIncome = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot delete pending income" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticIncomes({ type: "delete", id });

        const serverResult = await deleteIncomeAction(id);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to delete income:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticIncomes]
  );

  /**
   * Mark an income as received with optimistic update
   */
  const markIncomeReceived = useCallback(
    async (id: string, receivedTimestamp?: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending income" };
      }

      let result: { success: boolean; error?: string } = { success: true };
      const timestamp = receivedTimestamp ?? dateUtils.getCurrentTimestamp(timezone);

      startTransition(async () => {
        setOptimisticIncomes({
          type: "update",
          id,
          data: {
            status: "received",
            received_timestamp: timestamp,
          },
        });

        const serverResult = await markIncomeReceivedAction(id, timestamp, timezone);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to mark income as received:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticIncomes, timezone]
  );

  /**
   * Reset income status with optimistic update
   */
  const resetIncomeStatus = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending income" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticIncomes({
          type: "update",
          id,
          data: { status: "expected", received_timestamp: null },
        });

        const serverResult = await resetIncomeStatusAction(id);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to reset income status:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticIncomes]
  );

  // ================== BILL/DEBT OPERATIONS ==================

  /**
   * Add a new bill/debt with optimistic update
   */
  const addBill = useCallback(
    async (data: CreateBillInput): Promise<{ success: boolean; error?: string }> => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = dateUtils.getCurrentTimestamp(timezone);

      const optimisticBill: OptimisticDebt = {
        id: tempId,
        user_id: "",
        label: data.label,
        creditor: data.creditor ?? null,
        amount: data.amount,
        due_date: data.due_date ?? null,
        icon: data.icon ?? null,
        total_amount: data.total_amount ?? null,
        remaining_balance: data.remaining_balance ?? null,
        interest_rate: data.interest_rate ?? null,
        minimum_payment: data.minimum_payment ?? null,
        frequency: data.frequency ?? "monthly",
        payment_type: data.payment_type ?? "fixed",
        payment_mode: data.payment_mode ?? "manual",
        payment_bucket_id: data.payment_bucket_id ?? null,
        day_of_week: data.day_of_week ?? null,
        start_timestamp: data.start_timestamp ?? null,
        end_timestamp: data.end_timestamp ?? null,
        is_recurring: data.is_recurring ?? true,
        is_active: data.is_active ?? true,
        status: "pending",
        paid_timestamp: null,
        receive_timestamp: null,
        created_at: now,
        updated_at: now,
        pending: true,
      };

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticBills({ type: "add", debt: optimisticBill });

        const serverResult = await createBillAction(data);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to create bill:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills, timezone]
  );

  /**
   * Update a bill/debt with optimistic update
   */
  const updateBill = useCallback(
    async (id: string, data: UpdateBillInput): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending bill" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticBills({ type: "update", id, data });

        const serverResult = await updateBillAction(id, data);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to update bill:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills]
  );

  /**
   * Delete a bill/debt with optimistic update
   */
  const deleteBill = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot delete pending bill" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticBills({ type: "delete", id });

        const serverResult = await deleteBillAction(id);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to delete bill:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills]
  );

  /**
   * Mark a bill as paid with optimistic update
   */
  const markBillPaid = useCallback(
    async (id: string, paidTimestamp?: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending bill" };
      }

      let result: { success: boolean; error?: string } = { success: true };
      const timestamp = paidTimestamp ?? dateUtils.getCurrentTimestamp(timezone);

      startTransition(async () => {
        setOptimisticBills({
          type: "update",
          id,
          data: {
            status: "paid",
            paid_timestamp: timestamp,
          },
        });

        const serverResult = await markBillPaidAction(id, timestamp, timezone);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to mark bill as paid:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills, timezone]
  );

  /**
   * Reset bill status with optimistic update
   */
  const resetBillStatus = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending bill" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticBills({
          type: "update",
          id,
          data: { status: "pending", paid_timestamp: null },
        });

        const serverResult = await resetBillStatusAction(id);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to reset bill status:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills]
  );

  /**
   * Make a debt payment with optimistic update
   */
  const makeDebtPayment = useCallback(
    async (id: string, paymentAmount: number, paidTimestamp?: string): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending debt" };
      }

      // Find current debt to calculate new balance
      const currentDebt = optimisticBills.find((b) => b.id === id);
      if (!currentDebt) {
        return { success: false, error: "Debt not found" };
      }

      const currentBalance = currentDebt.remaining_balance ?? currentDebt.total_amount ?? 0;
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      const timestamp = paidTimestamp ?? dateUtils.getCurrentTimestamp(timezone);

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticBills({
          type: "update",
          id,
          data: {
            remaining_balance: newBalance,
            status: "paid",
            paid_timestamp: timestamp,
          },
        });

        const serverResult = await makeDebtPaymentAction(id, paymentAmount, timestamp, timezone);
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to make debt payment:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills, optimisticBills, timezone]
  );

  /**
   * Record a debt payment with history tracking (for variable debts)
   * This creates a payment record and updates the debt balance
   */
  const recordDebtPayment = useCallback(
    async (
      id: string,
      paymentAmount: number,
      paidTimestamp?: string,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending debt" };
      }

      // Find current debt to calculate new balance
      const currentDebt = optimisticBills.find((b) => b.id === id);
      if (!currentDebt) {
        return { success: false, error: "Debt not found" };
      }

      const currentBalance = currentDebt.remaining_balance ?? currentDebt.total_amount ?? 0;
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      const timestamp = paidTimestamp ?? dateUtils.getCurrentTimestamp(timezone);

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        setOptimisticBills({
          type: "update",
          id,
          data: {
            remaining_balance: newBalance,
            status: "paid",
            paid_timestamp: timestamp,
          },
        });

        const serverResult = await recordDebtPaymentAction({
          debt_id: id,
          amount: paymentAmount,
          payment_timestamp: timestamp,
          notes,
        });
        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to record debt payment:", serverResult.error);
        }
      });

      return result;
    },
    [setOptimisticBills, optimisticBills, timezone]
  );

  return {
    // State
    incomes: optimisticIncomes,
    bills: optimisticBills,
    isPending,

    // Income operations
    addIncome,
    updateIncome,
    deleteIncome,
    markIncomeReceived,
    resetIncomeStatus,

    // Bill/Debt operations
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    resetBillStatus,
    makeDebtPayment,
    recordDebtPayment,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  ExpenseDao,
  type LocalExpense,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/db/expense-dao";
import { useAuth } from "@/components/providers/auth-provider";
import { useSync } from "@/components/providers/sync-provider";

export function useExpenses(startDate: string, endDate: string) {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { sync } = useSync();
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dao = useMemo(() => new ExpenseDao(db), [db]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const results = await dao.findByDateRange(user.id, startDate, endDate);
    setExpenses(results);
    setIsLoading(false);
  }, [dao, user, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExpense = useCallback(
    async (input: Omit<CreateExpenseInput, "user_id">) => {
      if (!user) return;
      const expense = await dao.create({ ...input, user_id: user.id });
      setExpenses((prev) => [expense, ...prev]);
      sync();
    },
    [dao, user, sync]
  );

  const updateExpense = useCallback(
    async (id: string, input: UpdateExpenseInput) => {
      await dao.update(id, input);
      await refresh();
      sync();
    },
    [dao, refresh, sync]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await dao.softDelete(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      sync();
    },
    [dao, sync]
  );

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    expenses,
    isLoading,
    total,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LedgerEvent,
  LedgerEventInsert,
  LedgerEventUpdate,
} from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for ledger events — non-expense money movement
 * (inflows, savings transfers, reconciliation adjustments).
 *
 * Amounts are stored SIGNED: inflows positive, outflows negative.
 * Running balance = SUM(ledger_events.amount) - SUM(expenses.amount).
 */
class LedgerEventRepository extends BaseRepository<
  LedgerEvent,
  LedgerEventInsert,
  LedgerEventUpdate
> {
  protected tableName = "ledger_events";

  /**
   * Find events in a time range, newest first
   */
  async findInRange(
    supabase: SupabaseClient,
    userId: string,
    startTimestamp: string,
    endTimestamp: string
  ): Promise<LedgerEvent[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", startTimestamp)
      .lte("occurred_at", endTimestamp)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as LedgerEvent[];
  }

  /**
   * The user's opening balance event, if any (at most one exists —
   * enforced by a partial unique index).
   */
  async findOpeningBalance(
    supabase: SupabaseClient,
    userId: string
  ): Promise<LedgerEvent | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("type", "opening_balance")
      .maybeSingle();

    if (error) throw error;
    return (data as LedgerEvent) ?? null;
  }

  /**
   * Sum of all signed ledger event amounts for a user.
   */
  async sumAmounts(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("user_id", userId);

    if (error) throw error;
    return ((data ?? []) as { amount: number }[]).reduce(
      (acc, row) => acc + Number(row.amount),
      0
    );
  }

  /**
   * Derived running balance: Σ ledger_events − Σ expenses.
   * Soft-deleted expenses are excluded (deleted_at is null).
   */
  async getRunningBalance(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const [eventSum, expenseResult] = await Promise.all([
      this.sumAmounts(supabase, userId),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .is("deleted_at", null),
    ]);

    if (expenseResult.error) throw expenseResult.error;
    const expenseSum = (
      (expenseResult.data ?? []) as { amount: number }[]
    ).reduce((acc, row) => acc + Number(row.amount), 0);

    return eventSum - expenseSum;
  }
}

export const ledgerEventRepository = new LedgerEventRepository();

"use server";

import { revalidatePath } from "next/cache";
import {
  createLedgerInflowSchema,
  createSavingsContributionSchema,
  setOpeningBalanceSchema,
} from "@/lib/validations";
import { ledgerEventRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { LedgerEvent } from "@repo/database";

/**
 * Record an inflow: income received or a withdrawal from savings.
 * Amount is entered positive and stored positive.
 */
export async function createLedgerInflow(input: {
  type: "income" | "savings_withdrawal";
  amount: number;
  occurred_at?: string;
  note?: string | null;
}): Promise<ActionResult<LedgerEvent>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = createLedgerInflowSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const event = await ledgerEventRepository.create(supabase, {
      user_id: userId,
      type: validation.data.type,
      amount: validation.data.amount,
      occurred_at: validation.data.occurred_at ?? new Date().toISOString(),
      note: validation.data.note ?? null,
    });

    revalidatePath("/dashboard");
    return success(event);
  } catch (err) {
    console.error("Failed to create ledger inflow:", err);
    return error("Failed to record inflow", "DATABASE_ERROR");
  }
}

/**
 * Record money leaving the ledger to savings.
 * Amount is entered positive and stored NEGATIVE (outflow).
 * ledgr deliberately does not track the savings balance.
 */
export async function createSavingsContribution(input: {
  amount: number;
  occurred_at?: string;
  note?: string | null;
}): Promise<ActionResult<LedgerEvent>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = createSavingsContributionSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const event = await ledgerEventRepository.create(supabase, {
      user_id: userId,
      type: "savings_contribution",
      amount: -Math.abs(validation.data.amount),
      occurred_at: validation.data.occurred_at ?? new Date().toISOString(),
      note: validation.data.note ?? null,
    });

    revalidatePath("/dashboard");
    return success(event);
  } catch (err) {
    console.error("Failed to create savings contribution:", err);
    return error("Failed to record savings contribution", "DATABASE_ERROR");
  }
}

/**
 * Set the opening balance. At most one opening balance exists per user
 * (partial unique index); attempting to set a second returns CONFLICT.
 */
export async function setOpeningBalance(input: {
  amount: number;
}): Promise<ActionResult<LedgerEvent>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = setOpeningBalanceSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const existing = await ledgerEventRepository.findOpeningBalance(
      supabase,
      userId
    );
    if (existing) {
      return error("Opening balance already set", "CONFLICT");
    }

    const event = await ledgerEventRepository.create(supabase, {
      user_id: userId,
      type: "opening_balance",
      amount: validation.data.amount,
      occurred_at: new Date().toISOString(),
      note: null,
    });

    revalidatePath("/dashboard");
    return success(event);
  } catch (err) {
    console.error("Failed to set opening balance:", err);
    return error("Failed to set opening balance", "DATABASE_ERROR");
  }
}

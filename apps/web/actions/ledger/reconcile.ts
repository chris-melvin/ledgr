"use server";

import { revalidatePath } from "next/cache";
import { reconcileBalanceSchema } from "@/lib/validations";
import { ledgerEventRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { LedgerEvent } from "@repo/database";

export interface ReconcileResult {
  event: LedgerEvent | null;
  drift: number;
  balance: number;
}

/**
 * Reconcile the running balance to reality.
 * The user enters their actual balance; we record the signed difference
 * (actual − derived) as an `adjustment` event. Zero drift records nothing.
 */
export async function reconcileBalance(input: {
  actual_balance: number;
  note?: string | null;
}): Promise<ActionResult<ReconcileResult>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = reconcileBalanceSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const derived = await ledgerEventRepository.getRunningBalance(
      supabase,
      userId
    );
    const drift =
      Math.round((validation.data.actual_balance - derived) * 100) / 100;

    if (drift === 0) {
      return success({ event: null, drift: 0, balance: derived });
    }

    const event = await ledgerEventRepository.create(supabase, {
      user_id: userId,
      type: "adjustment",
      amount: drift,
      occurred_at: new Date().toISOString(),
      note: validation.data.note ?? null,
    });

    revalidatePath("/dashboard");
    return success({
      event,
      drift,
      balance: validation.data.actual_balance,
    });
  } catch (err) {
    console.error("Failed to reconcile balance:", err);
    return error("Failed to reconcile balance", "DATABASE_ERROR");
  }
}

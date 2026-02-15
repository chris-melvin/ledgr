"use server";

import { revalidatePath } from "next/cache";
import { updateExpenseSchema, expenseIdSchema } from "@/lib/validations";
import { expenseRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Expense } from "@repo/database";

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult<Expense>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // 2. Validate ID
  const idValidation = expenseIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return error("Invalid expense ID", "VALIDATION_ERROR");
  }

  // 3. Parse and validate input
  const rawData: Record<string, unknown> = {};

  const occurred_at = formData.get("occurred_at");
  if (occurred_at) rawData.occurred_at = occurred_at;

  const amount = formData.get("amount");
  if (amount) rawData.amount = amount;

  const label = formData.get("label");
  if (label) rawData.label = label;

  const category = formData.get("category");
  if (category !== null) rawData.category = category || null;

  const notes = formData.get("notes");
  if (notes !== null) rawData.notes = notes || null;

  const bucket_id = formData.get("bucket_id");
  if (bucket_id !== null) rawData.bucket_id = bucket_id || null;

  const validation = updateExpenseSchema.safeParse(rawData);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  // 4. Execute update directly (no TOCTOU check)
  // This eliminates the race condition where expense could be deleted between
  // checking existence and updating
  try {
    const expense = await expenseRepository.update(
      supabase,
      id,
      userId,
      validation.data
    );

    revalidatePath("/dashboard");

    return success(expense);
  } catch (err) {
    // Handle PGRST116 (no rows returned) - expense was deleted or doesn't exist
    if (err && typeof err === "object" && "code" in err && err.code === "PGRST116") {
      return error("Expense not found or was deleted", "NOT_FOUND");
    }
    console.error("Failed to update expense:", err);
    return error("Failed to update expense", "DATABASE_ERROR");
  }
}

/**
 * Update expense from data object (for programmatic use)
 */
export async function updateExpenseFromData(
  id: string,
  data: {
    category?: string | null;
    bucket_id?: string | null;
    amount?: number;
    label?: string;
    notes?: string | null;
  }
): Promise<ActionResult<Expense>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // Validate ID
  const idValidation = expenseIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return error("Invalid expense ID", "VALIDATION_ERROR");
  }

  // Execute update directly (no TOCTOU check)
  try {
    const expense = await expenseRepository.update(supabase, id, userId, data);

    revalidatePath("/dashboard");

    return success(expense);
  } catch (err) {
    // Handle PGRST116 (no rows returned) - expense was deleted or doesn't exist
    if (err && typeof err === "object" && "code" in err && err.code === "PGRST116") {
      return error("Expense not found or was deleted", "NOT_FOUND");
    }
    console.error("Failed to update expense:", err);
    return error("Failed to update expense", "DATABASE_ERROR");
  }
}

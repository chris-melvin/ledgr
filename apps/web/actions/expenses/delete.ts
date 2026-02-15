"use server";

import { revalidatePath } from "next/cache";
import { expenseIdSchema } from "@/lib/validations";
import { expenseRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";

export async function deleteExpense(id: string): Promise<ActionResult<void>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // 2. Validate ID
  const idValidation = expenseIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return error("Invalid expense ID", "VALIDATION_ERROR");
  }

  // 3. Check if expense exists
  const existing = await expenseRepository.findById(supabase, id, userId);
  if (!existing) {
    return error("Expense not found", "NOT_FOUND");
  }

  // 4. Execute delete
  try {
    await expenseRepository.delete(supabase, id, userId);

    revalidatePath("/dashboard");

    return success(undefined);
  } catch (err) {
    console.error("Failed to delete expense:", err);
    return error("Failed to delete expense", "DATABASE_ERROR");
  }
}

/**
 * Delete multiple expenses
 */
export async function deleteExpenses(
  ids: string[]
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // Validate all IDs
  for (const id of ids) {
    const idValidation = expenseIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return error(`Invalid expense ID: ${id}`, "VALIDATION_ERROR");
    }
  }

  try {
    await expenseRepository.deleteMany(supabase, ids, userId);

    revalidatePath("/dashboard");

    return success(undefined);
  } catch (err) {
    console.error("Failed to delete expenses:", err);
    return error("Failed to delete expenses", "DATABASE_ERROR");
  }
}

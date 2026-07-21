"use server";

import { revalidatePath } from "next/cache";
import {
  createScheduledEventSchema,
  updateScheduledEventSchema,
} from "@/lib/validations";
import { scheduledEventRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { ScheduledEvent } from "@repo/database";

/**
 * Create an upcoming scheduled event (bill, income, or top-up) the runway
 * forecast projects against. Amount is stored positive; direction gives sign.
 */
export async function createScheduledEvent(input: {
  direction: "inflow" | "outflow";
  amount: number;
  label: string;
  next_at: string;
  recurrence?: "none" | "weekly" | "biweekly" | "monthly";
}): Promise<ActionResult<ScheduledEvent>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = createScheduledEventSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const event = await scheduledEventRepository.create(supabase, {
      user_id: userId,
      direction: validation.data.direction,
      amount: validation.data.amount,
      label: validation.data.label,
      next_at: validation.data.next_at,
      recurrence: validation.data.recurrence,
    });

    revalidatePath("/dashboard");
    return success(event);
  } catch (err) {
    console.error("Failed to create scheduled event:", err);
    return error("Failed to save upcoming event", "DATABASE_ERROR");
  }
}

/**
 * Update an existing scheduled event (edit fields or toggle is_active).
 */
export async function updateScheduledEvent(input: {
  id: string;
  direction?: "inflow" | "outflow";
  amount?: number;
  label?: string;
  next_at?: string;
  recurrence?: "none" | "weekly" | "biweekly" | "monthly";
  is_active?: boolean;
}): Promise<ActionResult<ScheduledEvent>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = updateScheduledEventSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const { id, ...changes } = validation.data;

  try {
    const event = await scheduledEventRepository.update(
      supabase,
      id,
      userId,
      changes
    );

    revalidatePath("/dashboard");
    return success(event);
  } catch (err) {
    console.error("Failed to update scheduled event:", err);
    return error("Failed to update upcoming event", "DATABASE_ERROR");
  }
}

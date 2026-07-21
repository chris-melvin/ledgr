"use server";

import { revalidatePath } from "next/cache";
import { scheduledEventIdSchema } from "@/lib/validations";
import { scheduledEventRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";

/**
 * Permanently delete a scheduled event.
 */
export async function deleteScheduledEvent(input: {
  id: string;
}): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = scheduledEventIdSchema.safeParse(input);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    await scheduledEventRepository.delete(supabase, validation.data.id, userId);
    revalidatePath("/dashboard");
    return success({ id: validation.data.id });
  } catch (err) {
    console.error("Failed to delete scheduled event:", err);
    return error("Failed to remove upcoming event", "DATABASE_ERROR");
  }
}

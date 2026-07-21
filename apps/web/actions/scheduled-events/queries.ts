"use server";

import { scheduledEventRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { ScheduledEvent } from "@repo/database";

/**
 * Active scheduled events for the current user, soonest first.
 */
export async function getScheduledEvents(): Promise<
  ActionResult<ScheduledEvent[]>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const events = await scheduledEventRepository.findActive(supabase, userId);
    return success(events);
  } catch (err) {
    console.error("Failed to fetch scheduled events:", err);
    return error("Failed to fetch upcoming events", "DATABASE_ERROR");
  }
}

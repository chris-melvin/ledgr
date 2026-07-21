import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ScheduledEvent,
  ScheduledEventInsert,
  ScheduledEventUpdate,
} from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for scheduled events — known upcoming money movements (bills,
 * income, top-ups) the runway forecast projects the balance against.
 */
class ScheduledEventRepository extends BaseRepository<
  ScheduledEvent,
  ScheduledEventInsert,
  ScheduledEventUpdate
> {
  protected tableName = "scheduled_events";

  /**
   * Active scheduled events for a user, soonest first.
   */
  async findActive(
    supabase: SupabaseClient,
    userId: string
  ): Promise<ScheduledEvent[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("next_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as ScheduledEvent[];
  }
}

export const scheduledEventRepository = new ScheduledEventRepository();

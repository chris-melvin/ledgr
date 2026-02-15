import type { SQLiteDatabase } from "expo-sqlite";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SyncQueueItem {
  id: number;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload: string | null;
  created_at: string;
  retry_count: number;
}

const MAX_RETRIES = 5;
const BATCH_SIZE = 50;

export async function pushChanges(
  db: SQLiteDatabase,
  supabase: SupabaseClient
): Promise<{ pushed: number; failed: number }> {
  const items = await db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue
     WHERE retry_count < ?
     ORDER BY created_at ASC
     LIMIT ?`,
    [MAX_RETRIES, BATCH_SIZE]
  );

  let pushed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await processItem(supabase, item);
      // Remove from queue on success
      await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
      // Mark the entity as synced
      if (item.entity_type === "expenses") {
        const now = new Date().toISOString();
        await db.runAsync(
          `UPDATE expenses SET is_synced = 1, last_synced_at = ? WHERE id = ?`,
          [now, item.entity_id]
        );
      }
      pushed++;
    } catch (error) {
      console.error(`[Sync:Push] Failed to push ${item.entity_type}/${item.entity_id}:`, error);
      await db.runAsync(
        `UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?`,
        [item.id]
      );
      failed++;
    }
  }

  return { pushed, failed };
}

async function processItem(
  supabase: SupabaseClient,
  item: SyncQueueItem
): Promise<void> {
  const payload = item.payload ? JSON.parse(item.payload) : null;

  switch (item.operation) {
    case "create": {
      if (!payload) throw new Error("Create operation requires payload");
      const { id, user_id, amount, label, category, occurred_at, created_at, updated_at } = payload;
      const { error } = await supabase
        .from(item.entity_type)
        .upsert(
          { id, user_id, amount, label, category, occurred_at, created_at, updated_at },
          { onConflict: "id" }
        );
      if (error) throw error;
      break;
    }

    case "update": {
      if (!payload) throw new Error("Update operation requires payload");
      const { amount, label, category, occurred_at, updated_at } = payload;
      const { error } = await supabase
        .from(item.entity_type)
        .update({ amount, label, category, occurred_at, updated_at })
        .eq("id", item.entity_id);
      if (error) throw error;
      break;
    }

    case "delete": {
      const { error } = await supabase
        .from(item.entity_type)
        .delete()
        .eq("id", item.entity_id);
      if (error) throw error;
      break;
    }

    default:
      throw new Error(`Unknown operation: ${item.operation}`);
  }
}

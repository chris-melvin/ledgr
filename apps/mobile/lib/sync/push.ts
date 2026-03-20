import type { SQLiteDatabase } from "expo-sqlite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEntityConfig } from "./entity-registry";

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

      // Mark the entity as synced in its local table
      const config = getEntityConfig(item.entity_type);
      if (config) {
        const now = new Date().toISOString();
        await db.runAsync(
          `UPDATE ${config.localTable} SET is_synced = 1, last_synced_at = ? WHERE id = ?`,
          [now, item.entity_id]
        );
      }
      pushed++;
    } catch (error) {
      console.error(
        `[Sync:Push] Failed to push ${item.entity_type}/${item.entity_id}:`,
        error
      );
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
  const config = getEntityConfig(item.entity_type);

  switch (item.operation) {
    case "create": {
      if (!payload) throw new Error("Create operation requires payload");
      // Extract only the fields the remote table expects
      const fields = config?.createFields ?? Object.keys(payload);
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        if (field in payload) {
          data[field] = payload[field];
        }
      }
      // Map local column names to remote if needed (e.g., trigger_word → trigger)
      if (item.entity_type === "shortcuts" && "trigger_word" in data) {
        data.trigger = data.trigger_word;
        delete data.trigger_word;
      }
      const { error } = await supabase
        .from(config?.remoteTable ?? item.entity_type)
        .upsert(data, { onConflict: "id" });
      if (error) throw error;
      break;
    }

    case "update": {
      if (!payload) throw new Error("Update operation requires payload");
      const fields = config?.updateFields ?? Object.keys(payload);
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        if (field in payload) {
          data[field] = payload[field];
        }
      }
      if (item.entity_type === "shortcuts" && "trigger_word" in data) {
        data.trigger = data.trigger_word;
        delete data.trigger_word;
      }
      const { error } = await supabase
        .from(config?.remoteTable ?? item.entity_type)
        .update(data)
        .eq("id", item.entity_id);
      if (error) throw error;
      break;
    }

    case "delete": {
      const { error } = await supabase
        .from(config?.remoteTable ?? item.entity_type)
        .delete()
        .eq("id", item.entity_id);
      if (error) throw error;
      break;
    }

    default:
      throw new Error(`Unknown operation: ${item.operation}`);
  }
}

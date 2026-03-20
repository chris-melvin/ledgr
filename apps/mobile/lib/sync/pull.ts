import type { SQLiteDatabase } from "expo-sqlite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEntityConfigsSorted, type EntitySyncConfig } from "./entity-registry";

const PAGE_SIZE = 500;

export async function pullChanges(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string
): Promise<{ pulled: number }> {
  const configs = getEntityConfigsSorted();
  let totalPulled = 0;

  for (const config of configs) {
    const pulled = await pullEntity(db, supabase, userId, config);
    totalPulled += pulled;
  }

  return { pulled: totalPulled };
}

async function pullEntity(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
  config: EntitySyncConfig
): Promise<number> {
  // Get the last pull watermark
  const metadata = await db.getFirstAsync<{ last_pulled_at: string | null }>(
    `SELECT last_pulled_at FROM sync_metadata WHERE entity_type = ?`,
    [config.localTable]
  );
  const lastPulledAt = metadata?.last_pulled_at;

  let pulled = 0;
  let hasMore = true;
  let cursor = lastPulledAt;

  while (hasMore) {
    let query = supabase
      .from(config.remoteTable)
      .select("*")
      .order("updated_at", { ascending: true })
      .limit(PAGE_SIZE);

    if (config.userScoped) {
      query = query.eq("user_id", userId);
    }

    if (cursor) {
      query = query.gt("updated_at", cursor);
    }

    const { data: remoteRecords, error } = await query;
    if (error) throw error;
    if (!remoteRecords || remoteRecords.length === 0) break;

    for (const remote of remoteRecords) {
      // Check if we have a local version
      const local = await db.getFirstAsync<{
        id: string;
        is_synced: number;
        updated_at: string;
      }>(
        `SELECT id, is_synced, updated_at FROM ${config.localTable} WHERE id = ?`,
        [remote.id]
      );

      if (!local) {
        // New record from remote
        await config.upsertFromRemote(db, remote);
        pulled++;
      } else if (local.is_synced === 1) {
        // No local changes — safe to overwrite
        await config.upsertFromRemote(db, remote);
        pulled++;
      } else {
        // Conflict: last-write-wins
        const remoteTime = new Date(remote.updated_at).getTime();
        const localTime = new Date(local.updated_at).getTime();

        if (remoteTime > localTime) {
          await config.upsertFromRemote(db, remote);
          // Remove pending sync queue entries
          await db.runAsync(
            `DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?`,
            [config.localTable, remote.id]
          );
          pulled++;
        }
        // If local is newer, keep local (will be pushed next sync)
      }
    }

    // Update watermark
    const latestUpdatedAt = remoteRecords[remoteRecords.length - 1]?.updated_at;
    if (latestUpdatedAt) {
      cursor = latestUpdatedAt;
      await db.runAsync(
        `INSERT INTO sync_metadata (entity_type, last_pulled_at)
         VALUES (?, ?)
         ON CONFLICT(entity_type) DO UPDATE SET last_pulled_at = ?`,
        [config.localTable, latestUpdatedAt, latestUpdatedAt]
      );
    }

    hasMore = remoteRecords.length === PAGE_SIZE;
  }

  return pulled;
}

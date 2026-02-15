import type { SQLiteDatabase } from "expo-sqlite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ExpenseDao } from "@/lib/db/expense-dao";

export async function pullChanges(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string
): Promise<{ pulled: number }> {
  const dao = new ExpenseDao(db);

  // Get the last pull watermark
  const metadata = await db.getFirstAsync<{ last_pulled_at: string | null }>(
    `SELECT last_pulled_at FROM sync_metadata WHERE entity_type = 'expenses'`
  );
  const lastPulledAt = metadata?.last_pulled_at;

  // Fetch updated records from Supabase
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: true })
    .limit(500);

  if (lastPulledAt) {
    query = query.gt("updated_at", lastPulledAt);
  }

  const { data: remoteExpenses, error } = await query;
  if (error) throw error;
  if (!remoteExpenses || remoteExpenses.length === 0) return { pulled: 0 };

  let pulled = 0;

  for (const remote of remoteExpenses) {
    // Check if we have a local unsynced version
    const local = await db.getFirstAsync<{
      id: string;
      is_synced: number;
      updated_at: string;
    }>(`SELECT id, is_synced, updated_at FROM expenses WHERE id = ?`, [remote.id]);

    if (!local) {
      // New record from remote — insert locally
      await dao.upsertFromRemote(remote);
      pulled++;
    } else if (local.is_synced === 1) {
      // No local changes — safe to overwrite
      await dao.upsertFromRemote(remote);
      pulled++;
    } else {
      // Conflict: local has unsynced changes — last-write-wins
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = new Date(local.updated_at).getTime();

      if (remoteTime > localTime) {
        // Remote wins — overwrite local
        await dao.upsertFromRemote(remote);
        // Remove any pending sync queue entries for this entity
        await db.runAsync(
          `DELETE FROM sync_queue WHERE entity_type = 'expenses' AND entity_id = ?`,
          [remote.id]
        );
        pulled++;
      }
      // If local is newer, keep local version (it will be pushed on next sync)
    }
  }

  // Update watermark
  const latestUpdatedAt = remoteExpenses[remoteExpenses.length - 1]?.updated_at;
  if (latestUpdatedAt) {
    await db.runAsync(
      `INSERT INTO sync_metadata (entity_type, last_pulled_at)
       VALUES ('expenses', ?)
       ON CONFLICT(entity_type) DO UPDATE SET last_pulled_at = ?`,
      [latestUpdatedAt, latestUpdatedAt]
    );
  }

  return { pulled };
}

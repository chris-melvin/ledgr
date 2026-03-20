import { useCallback, useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/components/providers/auth-provider";
import { useSync } from "@/components/providers/sync-provider";
import uuid from "react-native-uuid";

export interface LocalShortcut {
  id: string;
  user_id: string;
  trigger_word: string;
  label: string;
  category_id: string | null;
  category: string | null;
  icon: string | null;
  default_amount: number | null;
  created_at: string;
  updated_at: string;
  is_synced: number;
}

export function useShortcuts() {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { sync } = useSync();
  const [shortcuts, setShortcuts] = useState<LocalShortcut[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const results = await db.getAllAsync<LocalShortcut>(
      `SELECT * FROM shortcuts WHERE user_id = ? ORDER BY trigger_word ASC`,
      [user.id]
    );
    setShortcuts(results);
  }, [db, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const shortcutMap = useMemo(
    () => new Map(shortcuts.map((s) => [s.trigger_word.toLowerCase(), s])),
    [shortcuts]
  );

  const addShortcut = useCallback(
    async (input: {
      trigger_word: string;
      label: string;
      category?: string;
      default_amount?: number;
    }) => {
      if (!user) return;
      const id = uuid.v4() as string;
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO shortcuts (id, user_id, trigger_word, label, category, default_amount, created_at, updated_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id,
          user.id,
          input.trigger_word,
          input.label,
          input.category ?? null,
          input.default_amount ?? null,
          now,
          now,
        ]
      );
      await db.runAsync(
        `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
         VALUES ('shortcuts', ?, 'create', ?, ?)
         ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
           payload = excluded.payload, created_at = excluded.created_at, retry_count = 0`,
        [
          id,
          JSON.stringify({
            id,
            user_id: user.id,
            trigger: input.trigger_word,
            label: input.label,
            category: input.category ?? null,
            default_amount: input.default_amount ?? null,
            created_at: now,
            updated_at: now,
          }),
          now,
        ]
      );
      await refresh();
      sync();
    },
    [db, user, refresh, sync]
  );

  const deleteShortcut = useCallback(
    async (id: string) => {
      if (!user) return;
      const now = new Date().toISOString();
      await db.runAsync(`DELETE FROM shortcuts WHERE id = ?`, [id]);
      await db.runAsync(
        `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
         VALUES ('shortcuts', ?, 'delete', NULL, ?)
         ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
           payload = excluded.payload, created_at = excluded.created_at, retry_count = 0`,
        [id, now]
      );
      await refresh();
      sync();
    },
    [db, user, refresh, sync]
  );

  return { shortcuts, shortcutMap, refresh, addShortcut, deleteShortcut };
}

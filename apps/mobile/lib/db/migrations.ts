import type { SQLiteDatabase } from "expo-sqlite";
import {
  CREATE_EXPENSES_TABLE,
  CREATE_SYNC_QUEUE_TABLE,
  CREATE_SYNC_METADATA_TABLE,
  CREATE_INDEXES,
} from "./schema";

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(CREATE_EXPENSES_TABLE);
      await db.execAsync(CREATE_SYNC_QUEUE_TABLE);
      await db.execAsync(CREATE_SYNC_METADATA_TABLE);
      // Indexes must be created one at a time
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_expenses_user_occurred ON expenses(user_id, occurred_at)`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_expenses_is_synced ON expenses(is_synced)`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at)`
      );
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentVersion = result?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    }
  }
}

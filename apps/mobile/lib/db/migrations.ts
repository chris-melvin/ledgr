import type { SQLiteDatabase } from "expo-sqlite";
import {
  CREATE_EXPENSES_TABLE,
  CREATE_SYNC_QUEUE_TABLE,
  CREATE_SYNC_METADATA_TABLE,
  CREATE_USER_SETTINGS_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_BUDGET_BUCKETS_TABLE,
  CREATE_SHORTCUTS_TABLE,
  CREATE_INCOMES_TABLE,
  CREATE_SUBSCRIPTIONS_TABLE,
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
  {
    version: 2,
    up: async (db) => {
      // Add new columns to expenses table
      await db.execAsync(`ALTER TABLE expenses ADD COLUMN category_id TEXT`);
      await db.execAsync(`ALTER TABLE expenses ADD COLUMN bucket_id TEXT`);
      await db.execAsync(`ALTER TABLE expenses ADD COLUMN notes TEXT`);
      await db.execAsync(
        `ALTER TABLE expenses ADD COLUMN recurring_expense_id TEXT`
      );

      // Create new tables
      await db.execAsync(CREATE_USER_SETTINGS_TABLE);
      await db.execAsync(CREATE_CATEGORIES_TABLE);
      await db.execAsync(CREATE_BUDGET_BUCKETS_TABLE);
      await db.execAsync(CREATE_SHORTCUTS_TABLE);
      await db.execAsync(CREATE_INCOMES_TABLE);
      await db.execAsync(CREATE_SUBSCRIPTIONS_TABLE);

      // Indexes for new tables
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_budget_buckets_user ON budget_buckets(user_id)`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_shortcuts_user ON shortcuts(user_id)`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id)`
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

import type { SQLiteDatabase } from "expo-sqlite";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RemoteRecord = Record<string, any>;

/**
 * Describes how to sync a specific entity type between SQLite and Supabase.
 */
export interface EntitySyncConfig {
  /** Local SQLite table name */
  localTable: string;
  /** Remote Supabase table name */
  remoteTable: string;
  /** Sync order (lower = synced first). Ensures referential integrity. */
  order: number;
  /** Whether the entity uses user_id scoping */
  userScoped: boolean;
  /** Fields to extract from payload for Supabase upsert (create) */
  createFields: string[];
  /** Fields to extract from payload for Supabase update */
  updateFields: string[];
  /** Whether this entity supports soft deletes (deleted_at) */
  softDelete: boolean;
  /** Upsert from remote into local SQLite */
  upsertFromRemote: (db: SQLiteDatabase, record: RemoteRecord) => Promise<void>;
}

/**
 * Registry of all syncable entity types, ordered by sync priority.
 */
export const ENTITY_REGISTRY: EntitySyncConfig[] = [
  {
    localTable: "user_settings",
    remoteTable: "user_settings",
    order: 0,
    userScoped: true,
    createFields: [
      "id", "user_id", "default_daily_limit", "currency", "timezone",
      "week_starts_on", "tracking_mode", "subscription_tier", "card_preferences",
      "total_monthly_income", "total_fixed_expenses", "calculated_daily_limit",
      "budget_setup_completed", "show_savings_in_allocation",
      "created_at", "updated_at",
    ],
    updateFields: [
      "default_daily_limit", "currency", "timezone", "week_starts_on",
      "tracking_mode", "card_preferences", "total_monthly_income",
      "total_fixed_expenses", "calculated_daily_limit",
      "budget_setup_completed", "show_savings_in_allocation", "updated_at",
    ],
    softDelete: false,
    upsertFromRemote: async (db, r) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO user_settings (id, user_id, default_daily_limit, currency, timezone, week_starts_on, tracking_mode, subscription_tier, card_preferences, total_monthly_income, total_fixed_expenses, calculated_daily_limit, budget_setup_completed, show_savings_in_allocation, created_at, updated_at, is_synced, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           default_daily_limit=excluded.default_daily_limit, currency=excluded.currency,
           timezone=excluded.timezone, week_starts_on=excluded.week_starts_on,
           tracking_mode=excluded.tracking_mode, subscription_tier=excluded.subscription_tier,
           card_preferences=excluded.card_preferences,
           total_monthly_income=excluded.total_monthly_income,
           total_fixed_expenses=excluded.total_fixed_expenses,
           calculated_daily_limit=excluded.calculated_daily_limit,
           budget_setup_completed=excluded.budget_setup_completed,
           show_savings_in_allocation=excluded.show_savings_in_allocation,
           updated_at=excluded.updated_at, is_synced=1, last_synced_at=?`,
        [
          r.id, r.user_id, r.default_daily_limit, r.currency, r.timezone,
          r.week_starts_on, r.tracking_mode, r.subscription_tier,
          typeof r.card_preferences === "object" ? JSON.stringify(r.card_preferences) : r.card_preferences,
          r.total_monthly_income, r.total_fixed_expenses, r.calculated_daily_limit,
          r.budget_setup_completed ? 1 : 0, r.show_savings_in_allocation ? 1 : 0,
          r.created_at, r.updated_at, now, now,
        ]
      );
    },
  },
  {
    localTable: "categories",
    remoteTable: "categories",
    order: 1,
    userScoped: true,
    createFields: [
      "id", "user_id", "name", "parent_id", "icon", "color",
      "is_system", "sort_order", "created_at", "updated_at",
    ],
    updateFields: [
      "name", "parent_id", "icon", "color", "is_system", "sort_order", "updated_at",
    ],
    softDelete: false,
    upsertFromRemote: async (db, r) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO categories (id, user_id, name, parent_id, icon, color, is_system, sort_order, created_at, updated_at, is_synced, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, parent_id=excluded.parent_id, icon=excluded.icon,
           color=excluded.color, is_system=excluded.is_system, sort_order=excluded.sort_order,
           updated_at=excluded.updated_at, is_synced=1, last_synced_at=?`,
        [
          r.id, r.user_id, r.name, r.parent_id, r.icon, r.color,
          r.is_system ? 1 : 0, r.sort_order, r.created_at, r.updated_at, now, now,
        ]
      );
    },
  },
  {
    localTable: "budget_buckets",
    remoteTable: "budget_buckets",
    order: 2,
    userScoped: true,
    createFields: [
      "id", "user_id", "name", "slug", "percentage", "target_amount",
      "allocated_amount", "color", "icon", "description",
      "is_default", "is_system", "sort_order", "created_at", "updated_at",
    ],
    updateFields: [
      "name", "slug", "percentage", "target_amount", "allocated_amount",
      "color", "icon", "description", "is_default", "is_system", "sort_order", "updated_at",
    ],
    softDelete: false,
    upsertFromRemote: async (db, r) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO budget_buckets (id, user_id, name, slug, percentage, target_amount, allocated_amount, color, icon, description, is_default, is_system, sort_order, created_at, updated_at, is_synced, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, slug=excluded.slug, percentage=excluded.percentage,
           target_amount=excluded.target_amount, allocated_amount=excluded.allocated_amount,
           color=excluded.color, icon=excluded.icon, description=excluded.description,
           is_default=excluded.is_default, is_system=excluded.is_system,
           sort_order=excluded.sort_order, updated_at=excluded.updated_at,
           is_synced=1, last_synced_at=?`,
        [
          r.id, r.user_id, r.name, r.slug, r.percentage, r.target_amount,
          r.allocated_amount, r.color, r.icon, r.description,
          r.is_default ? 1 : 0, r.is_system ? 1 : 0, r.sort_order,
          r.created_at, r.updated_at, now, now,
        ]
      );
    },
  },
  {
    localTable: "shortcuts",
    remoteTable: "shortcuts",
    order: 3,
    userScoped: true,
    createFields: [
      "id", "user_id", "trigger", "label", "category_id", "category",
      "icon", "default_amount", "created_at", "updated_at",
    ],
    updateFields: [
      "trigger", "label", "category_id", "category", "icon", "default_amount", "updated_at",
    ],
    softDelete: false,
    upsertFromRemote: async (db, r) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO shortcuts (id, user_id, trigger_word, label, category_id, category, icon, default_amount, created_at, updated_at, is_synced, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           trigger_word=excluded.trigger_word, label=excluded.label,
           category_id=excluded.category_id, category=excluded.category,
           icon=excluded.icon, default_amount=excluded.default_amount,
           updated_at=excluded.updated_at, is_synced=1, last_synced_at=?`,
        [
          r.id, r.user_id, r.trigger, r.label, r.category_id, r.category,
          r.icon, r.default_amount, r.created_at, r.updated_at, now, now,
        ]
      );
    },
  },
  {
    localTable: "incomes",
    remoteTable: "incomes",
    order: 4,
    userScoped: true,
    createFields: [
      "id", "user_id", "label", "amount", "day_of_month", "day_of_week",
      "frequency", "start_timestamp", "end_timestamp", "expected_timestamp",
      "received_timestamp", "is_active", "status", "created_at", "updated_at",
    ],
    updateFields: [
      "label", "amount", "day_of_month", "day_of_week", "frequency",
      "start_timestamp", "end_timestamp", "expected_timestamp",
      "received_timestamp", "is_active", "status", "updated_at",
    ],
    softDelete: false,
    upsertFromRemote: async (db, r) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO incomes (id, user_id, label, amount, day_of_month, day_of_week, frequency, start_timestamp, end_timestamp, expected_timestamp, received_timestamp, is_active, status, created_at, updated_at, is_synced, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           label=excluded.label, amount=excluded.amount,
           day_of_month=excluded.day_of_month, day_of_week=excluded.day_of_week,
           frequency=excluded.frequency, start_timestamp=excluded.start_timestamp,
           end_timestamp=excluded.end_timestamp, expected_timestamp=excluded.expected_timestamp,
           received_timestamp=excluded.received_timestamp, is_active=excluded.is_active,
           status=excluded.status, updated_at=excluded.updated_at,
           is_synced=1, last_synced_at=?`,
        [
          r.id, r.user_id, r.label, r.amount, r.day_of_month, r.day_of_week,
          r.frequency, r.start_timestamp, r.end_timestamp, r.expected_timestamp,
          r.received_timestamp, r.is_active ? 1 : 0, r.status,
          r.created_at, r.updated_at, now, now,
        ]
      );
    },
  },
  {
    localTable: "expenses",
    remoteTable: "expenses",
    order: 5,
    userScoped: true,
    createFields: [
      "id", "user_id", "amount", "label", "category", "category_id",
      "bucket_id", "notes", "recurring_expense_id",
      "occurred_at", "created_at", "updated_at",
    ],
    updateFields: [
      "amount", "label", "category", "category_id", "bucket_id",
      "notes", "occurred_at", "updated_at",
    ],
    softDelete: true,
    upsertFromRemote: async (db, r) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO expenses (id, user_id, amount, label, category, category_id, bucket_id, notes, recurring_expense_id, occurred_at, created_at, updated_at, deleted_at, is_synced, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           amount=excluded.amount, label=excluded.label, category=excluded.category,
           category_id=excluded.category_id, bucket_id=excluded.bucket_id,
           notes=excluded.notes, occurred_at=excluded.occurred_at,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at,
           is_synced=1, last_synced_at=?`,
        [
          r.id, r.user_id, r.amount, r.label, r.category,
          r.category_id, r.bucket_id, r.notes, r.recurring_expense_id,
          r.occurred_at, r.created_at, r.updated_at, r.deleted_at, now, now,
        ]
      );
    },
  },
];

/** Get entity configs sorted by sync order */
export function getEntityConfigsSorted(): EntitySyncConfig[] {
  return [...ENTITY_REGISTRY].sort((a, b) => a.order - b.order);
}

/** Get entity config by local table name */
export function getEntityConfig(localTable: string): EntitySyncConfig | undefined {
  return ENTITY_REGISTRY.find((e) => e.localTable === localTable);
}

export const CREATE_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    label TEXT NOT NULL,
    category TEXT,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

export const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    UNIQUE(entity_type, entity_id, operation)
  );
`;

export const CREATE_SYNC_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    entity_type TEXT PRIMARY KEY,
    last_pulled_at TEXT
  );
`;

export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_expenses_user_occurred
    ON expenses(user_id, occurred_at);
  CREATE INDEX IF NOT EXISTS idx_expenses_is_synced
    ON expenses(is_synced);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_created
    ON sync_queue(created_at);
`;

// ── Migration v2 tables ──

export const CREATE_USER_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    default_daily_limit REAL DEFAULT 300,
    currency TEXT DEFAULT 'PHP',
    timezone TEXT DEFAULT 'Asia/Manila',
    week_starts_on INTEGER DEFAULT 0,
    tracking_mode TEXT DEFAULT 'tracking_only',
    subscription_tier TEXT DEFAULT 'free',
    card_preferences TEXT DEFAULT '{}',
    total_monthly_income REAL,
    total_fixed_expenses REAL,
    calculated_daily_limit REAL,
    budget_setup_completed INTEGER DEFAULT 0,
    show_savings_in_allocation INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT,
    icon TEXT,
    color TEXT,
    is_system INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

export const CREATE_BUDGET_BUCKETS_TABLE = `
  CREATE TABLE IF NOT EXISTS budget_buckets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    percentage REAL,
    target_amount REAL,
    allocated_amount REAL,
    color TEXT,
    icon TEXT,
    description TEXT,
    is_default INTEGER DEFAULT 0,
    is_system INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

export const CREATE_SHORTCUTS_TABLE = `
  CREATE TABLE IF NOT EXISTS shortcuts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    label TEXT NOT NULL,
    category_id TEXT,
    category TEXT,
    icon TEXT,
    default_amount REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

export const CREATE_INCOMES_TABLE = `
  CREATE TABLE IF NOT EXISTS incomes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL,
    day_of_month INTEGER,
    day_of_week INTEGER,
    frequency TEXT DEFAULT 'monthly',
    start_timestamp TEXT,
    end_timestamp TEXT,
    expected_timestamp TEXT,
    received_timestamp TEXT,
    is_active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'expected',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

export const CREATE_SUBSCRIPTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    provider TEXT,
    provider_subscription_id TEXT,
    provider_customer_id TEXT,
    status TEXT DEFAULT 'active',
    billing_cycle TEXT,
    current_period_start TEXT NOT NULL,
    current_period_end TEXT NOT NULL,
    cancel_at_period_end INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    last_synced_at TEXT
  );
`;

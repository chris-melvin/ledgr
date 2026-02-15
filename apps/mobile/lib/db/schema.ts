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

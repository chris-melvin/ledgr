-- Tracking bucket support (spending-clarity change). Additive only.
--
-- 1. budget_buckets.include_in_daily_avg — whether expenses in this bucket
--    feed the trailing daily-spend averages (Daily = true; Bills/Non-daily = false).
-- 2. shortcuts.bucket_id — optional default bucket applied to expenses
--    created through a shortcut (e.g., @fare → Daily).

ALTER TABLE budget_buckets
  ADD COLUMN IF NOT EXISTS include_in_daily_avg BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE shortcuts
  ADD COLUMN IF NOT EXISTS bucket_id UUID REFERENCES budget_buckets(id) ON DELETE SET NULL;

-- Existing default "daily spending"-style buckets should feed the average
UPDATE budget_buckets
SET include_in_daily_avg = TRUE
WHERE is_default = TRUE;

COMMENT ON COLUMN budget_buckets.include_in_daily_avg IS 'Expenses in this bucket count toward trailing daily-spend averages (spending-clarity).';
COMMENT ON COLUMN shortcuts.bucket_id IS 'Default bucket applied to expenses created via this shortcut. Explicit :bucket tags win.';

-- Scheduled events: known upcoming money movements — bills going out, income
-- and top-ups coming in — that the runway forecast projects the balance
-- against (runway-forecast change). Additive only; dormant clients unaffected.
--
-- `direction` supplies the sign; `amount` is stored POSITIVE. `recurrence`
-- expands a single row into a dated series across the forecast horizon.

DO $$ BEGIN
  CREATE TYPE scheduled_event_direction AS ENUM ('inflow', 'outflow');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scheduled_event_recurrence AS ENUM (
    'none',
    'weekly',
    'biweekly',
    'monthly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS scheduled_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  direction scheduled_event_direction NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0), -- always positive; direction gives sign
  label TEXT NOT NULL,
  next_at TIMESTAMPTZ NOT NULL, -- next (or a representative) occurrence
  recurrence scheduled_event_recurrence NOT NULL DEFAULT 'none',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_events_user_active
  ON scheduled_events(user_id, is_active, next_at);

ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scheduled events" ON scheduled_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled events" ON scheduled_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled events" ON scheduled_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scheduled events" ON scheduled_events FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE scheduled_events IS 'Upcoming dated money movements (bills, income, top-ups) the runway forecast projects against. Amount positive; direction gives the sign.';

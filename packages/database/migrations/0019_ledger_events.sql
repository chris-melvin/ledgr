-- Ledger events: non-expense money movement for the running balance
-- (spending-clarity change). Additive only — dormant mobile client unaffected.
--
-- Types:
--   opening_balance      (+) starting point, one active per user
--   income               (+) salary etc. received
--   savings_withdrawal   (+) money re-entering from savings
--   savings_contribution (-) money leaving to savings (not spending)
--   adjustment           (±) reconciliation drift correction
--
-- Amounts are stored SIGNED: inflows positive, outflows negative.
-- Running balance = SUM(ledger_events.amount) - SUM(expenses.amount).

DO $$ BEGIN
  CREATE TYPE ledger_event_type AS ENUM (
    'opening_balance',
    'income',
    'savings_withdrawal',
    'savings_contribution',
    'adjustment'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ledger_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type ledger_event_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL, -- signed: + inflow, - outflow
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce sign convention per type (adjustment may be either sign)
  CONSTRAINT ledger_events_sign_check CHECK (
    (type IN ('opening_balance', 'income', 'savings_withdrawal') AND amount >= 0)
    OR (type = 'savings_contribution' AND amount <= 0)
    OR (type = 'adjustment')
  )
);

-- One active opening balance per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_events_one_opening_balance
  ON ledger_events(user_id)
  WHERE type = 'opening_balance';

CREATE INDEX IF NOT EXISTS idx_ledger_events_user_occurred
  ON ledger_events(user_id, occurred_at DESC);

ALTER TABLE ledger_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger events" ON ledger_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ledger events" ON ledger_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ledger events" ON ledger_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ledger events" ON ledger_events FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE ledger_events IS 'Non-expense money movement (inflows, savings transfers, reconciliation adjustments) for the running balance. Amounts signed.';

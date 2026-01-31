-- Add tracking_mode to user_settings
-- This enables users to use the app for simple tracking without budget setup
-- Default is "tracking_only" for new users, existing users get "budget_enabled" if they've completed setup

-- Create tracking mode enum
DO $$ BEGIN
  CREATE TYPE tracking_mode AS ENUM ('tracking_only', 'budget_enabled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add tracking_mode column with default 'tracking_only'
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS tracking_mode tracking_mode DEFAULT 'tracking_only';

-- For existing users who have completed budget setup, set to 'budget_enabled'
UPDATE user_settings
SET tracking_mode = 'budget_enabled'
WHERE budget_setup_completed = true AND tracking_mode IS NULL;

-- Add index for filtering by tracking mode
CREATE INDEX IF NOT EXISTS idx_user_settings_tracking_mode
  ON user_settings(tracking_mode);

COMMENT ON COLUMN user_settings.tracking_mode IS 'User preference: tracking_only (no budget required) or budget_enabled (full budget features)';

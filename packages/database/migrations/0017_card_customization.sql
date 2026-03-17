-- Migration: Add card_preferences column to user_settings
-- Stores per-user hero card customization (theme, background, effects)

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS card_preferences JSONB DEFAULT '{}';

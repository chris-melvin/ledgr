import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";
import { useAuth } from "@/components/providers/auth-provider";
import { useSync } from "@/components/providers/sync-provider";
import { storage } from "@/lib/storage/mmkv";
import { calculateSimpleDailyLimit, getDaysInCurrentMonth } from "@repo/shared/budget";

export interface UserSettings {
  id: string;
  user_id: string;
  default_daily_limit: number;
  currency: string;
  timezone: string;
  week_starts_on: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  tracking_mode: "tracking_only" | "budget_enabled";
  subscription_tier: "free" | "pro";
  card_preferences: string;
  total_monthly_income: number | null;
  total_fixed_expenses: number | null;
  calculated_daily_limit: number | null;
  budget_setup_completed: boolean;
  show_savings_in_allocation: boolean;
}

const SETTINGS_MMKV_KEY = "user_settings";

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "user_id"> = {
  default_daily_limit: 300,
  currency: "PHP",
  timezone: "Asia/Manila",
  week_starts_on: 0,
  tracking_mode: "tracking_only",
  subscription_tier: "free",
  card_preferences: "{}",
  total_monthly_income: null,
  total_fixed_expenses: null,
  calculated_daily_limit: null,
  budget_setup_completed: false,
  show_savings_in_allocation: true,
};

function loadFromMMKV(): UserSettings | null {
  const raw = storage.getString(SETTINGS_MMKV_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToMMKV(settings: UserSettings): void {
  storage.set(SETTINGS_MMKV_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { sync } = useSync();

  // Initialize from MMKV cache for instant reads
  const [settings, setSettings] = useState<UserSettings | null>(
    () => loadFromMMKV()
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      default_daily_limit: number;
      currency: string;
      timezone: string;
      week_starts_on: number;
      tracking_mode: string;
      subscription_tier: string;
      card_preferences: string;
      total_monthly_income: number | null;
      total_fixed_expenses: number | null;
      calculated_daily_limit: number | null;
      budget_setup_completed: number;
      show_savings_in_allocation: number;
    }>(
      `SELECT * FROM user_settings WHERE user_id = ?`,
      [user.id]
    );

    if (row) {
      const parsed: UserSettings = {
        id: row.id,
        user_id: row.user_id,
        default_daily_limit: row.default_daily_limit,
        currency: row.currency,
        timezone: row.timezone,
        week_starts_on: row.week_starts_on as UserSettings["week_starts_on"],
        tracking_mode: row.tracking_mode as UserSettings["tracking_mode"],
        subscription_tier: row.subscription_tier as UserSettings["subscription_tier"],
        card_preferences: row.card_preferences,
        total_monthly_income: row.total_monthly_income,
        total_fixed_expenses: row.total_fixed_expenses,
        calculated_daily_limit: row.calculated_daily_limit,
        budget_setup_completed: row.budget_setup_completed === 1,
        show_savings_in_allocation: row.show_savings_in_allocation === 1,
      };
      setSettings(parsed);
      saveToMMKV(parsed);
    }
    setIsLoading(false);
  }, [db, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Ensure a user_settings row exists, creating one if needed.
  // Returns the row id, or null if no user is logged in.
  const ensureRow = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM user_settings WHERE user_id = ?`,
      [user.id]
    );
    if (existing) return existing.id;

    const id = uuid.v4() as string;
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO user_settings (id, user_id, default_daily_limit, currency, timezone, week_starts_on, tracking_mode, subscription_tier, card_preferences, created_at, updated_at, is_synced)
       VALUES (?, ?, 300, 'PHP', 'Asia/Manila', 0, 'tracking_only', 'free', '{}', ?, ?, 0)`,
      [id, user.id, now, now]
    );
    await refresh();
    return id;
  }, [db, user, refresh]);

  const updateSetting = useCallback(
    async (key: keyof Omit<UserSettings, "id" | "user_id">, value: string | number | boolean | null) => {
      if (!user) return;

      const rowId = await ensureRow();
      if (!rowId) return;

      const sqlValue = value === null ? null : typeof value === "boolean" ? (value ? 1 : 0) : value;
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE user_settings SET ${key} = ?, updated_at = ?, is_synced = 0 WHERE user_id = ?`,
        [sqlValue, now, user.id]
      );

      // Recalculate daily limit when budget inputs change
      if (key === "total_monthly_income" || key === "total_fixed_expenses") {
        const current = await db.getFirstAsync<{
          total_monthly_income: number | null;
          total_fixed_expenses: number | null;
        }>(
          `SELECT total_monthly_income, total_fixed_expenses FROM user_settings WHERE user_id = ?`,
          [user.id]
        );
        if (
          current &&
          current.total_monthly_income != null &&
          current.total_fixed_expenses != null
        ) {
          const newLimit = calculateSimpleDailyLimit(
            current.total_monthly_income,
            current.total_fixed_expenses,
            getDaysInCurrentMonth()
          );
          await db.runAsync(
            `UPDATE user_settings SET calculated_daily_limit = ?, updated_at = ?, is_synced = 0 WHERE user_id = ?`,
            [newLimit, now, user.id]
          );
        }
      }

      // Enqueue sync
      const updated = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT * FROM user_settings WHERE user_id = ?`,
        [user.id]
      );
      if (updated) {
        await db.runAsync(
          `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
           VALUES ('user_settings', ?, 'update', ?, ?)
           ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
             payload = excluded.payload, created_at = excluded.created_at, retry_count = 0`,
          [rowId, JSON.stringify(updated), now]
        );
      }

      await refresh();
      sync();
    },
    [db, user, ensureRow, refresh, sync]
  );

  // Provide defaults when no settings are synced yet
  const resolvedSettings = settings ?? {
    ...DEFAULT_SETTINGS,
    id: "",
    user_id: user?.id ?? "",
  };

  return {
    settings: resolvedSettings,
    isLoading,
    refresh,
    updateSetting,
    isPro: true, // All features unlocked — no paywall
  };
}

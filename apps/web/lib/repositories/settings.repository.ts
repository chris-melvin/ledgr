import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserSettings,
  UserSettingsInsert,
  UserSettingsUpdate,
} from "@repo/database";

/**
 * Repository for user settings operations
 * Unlike other entities, each user has exactly one settings record
 */
class SettingsRepository {
  private tableName = "user_settings";

  /**
   * Get settings for a user (creates default if not exists)
   */
  async getOrCreate(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserSettings> {
    // Try to get existing settings
    const { data: existing, error: fetchError } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing && !fetchError) {
      return existing as UserSettings;
    }

    // If not found (PGRST116), create default settings
    if (fetchError?.code === "PGRST116") {
      const defaultSettings: UserSettingsInsert = {
        user_id: userId,
        default_daily_limit: 300,
        currency: "PHP",
        timezone: "Asia/Manila",
        week_starts_on: 0,
        show_savings_in_allocation: true,
        tracking_mode: "tracking_only",
      };

      const { data: created, error: createError } = await supabase
        .from(this.tableName)
        .insert(defaultSettings)
        .select()
        .single();

      if (createError) throw createError;
      return created as UserSettings;
    }

    throw fetchError;
  }

  /**
   * Get settings for a user (returns null if not exists)
   */
  async get(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as UserSettings;
  }

  /**
   * Update settings for a user
   */
  async update(
    supabase: SupabaseClient,
    userId: string,
    data: UserSettingsUpdate
  ): Promise<UserSettings> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated as UserSettings;
  }

  /**
   * Upsert settings for a user (create or update)
   */
  async upsert(
    supabase: SupabaseClient,
    userId: string,
    data: UserSettingsUpdate
  ): Promise<UserSettings> {
    const existing = await this.get(supabase, userId);

    if (existing) {
      return this.update(supabase, userId, data);
    }

    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert({
        user_id: userId,
        default_daily_limit: 300,
        currency: "PHP",
        timezone: "Asia/Manila",
        week_starts_on: 0,
        show_savings_in_allocation: true,
        tracking_mode: "tracking_only",
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return created as UserSettings;
  }
}

// Export singleton instance
export const settingsRepository = new SettingsRepository();

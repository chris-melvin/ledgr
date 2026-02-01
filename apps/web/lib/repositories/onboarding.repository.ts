import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserOnboarding,
  UserOnboardingInsert,
  UserOnboardingUpdate,
  ProgressiveHintState,
} from "@repo/database";
import * as dateUtils from "@/lib/utils/date";

/**
 * Repository for user onboarding progress operations
 * Each user has exactly one onboarding record
 */
class OnboardingRepository {
  private tableName = "user_onboarding";

  /**
   * Get onboarding state for a user (creates default if not exists)
   */
  async getOrCreate(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding> {
    // Try to get existing onboarding state
    const { data: existing, error: fetchError } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing && !fetchError) {
      return existing as UserOnboarding;
    }

    // If not found (PGRST116), create default onboarding state
    if (fetchError?.code === "PGRST116") {
      const defaultOnboarding: UserOnboardingInsert = {
        user_id: userId,
        has_completed_tour: false,
        current_step: 0,
        progressive_hints_shown: {},
        features_discovered: {},
        expense_count: 0,
        days_active: 0,
      };

      const { data: created, error: createError } = await supabase
        .from(this.tableName)
        .insert(defaultOnboarding)
        .select()
        .single();

      if (createError) throw createError;
      return created as UserOnboarding;
    }

    throw fetchError;
  }

  /**
   * Get onboarding state for a user (returns null if not exists)
   */
  async get(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as UserOnboarding;
  }

  /**
   * Update onboarding state for a user
   */
  async update(
    supabase: SupabaseClient,
    userId: string,
    data: UserOnboardingUpdate
  ): Promise<UserOnboarding> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated as UserOnboarding;
  }

  /**
   * Advance to next step in the tour
   */
  async advanceStep(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding> {
    const current = await this.getOrCreate(supabase, userId);
    return this.update(supabase, userId, {
      current_step: current.current_step + 1,
    });
  }

  /**
   * Complete the tour
   */
  async completeTour(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding> {
    return this.update(supabase, userId, {
      has_completed_tour: true,
      tour_completed_at: new Date().toISOString(),
    });
  }

  /**
   * Skip the tour
   */
  async skipTour(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding> {
    return this.update(supabase, userId, {
      has_completed_tour: true,
      tour_skipped_at: new Date().toISOString(),
    });
  }

  /**
   * Reset onboarding to start fresh
   */
  async reset(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding> {
    return this.update(supabase, userId, {
      has_completed_tour: false,
      current_step: 0,
      tour_skipped_at: null,
      tour_completed_at: null,
      progressive_hints_shown: {},
    });
  }

  /**
   * Mark a progressive hint as shown
   */
  async markHintShown(
    supabase: SupabaseClient,
    userId: string,
    hintId: string
  ): Promise<UserOnboarding> {
    const current = await this.getOrCreate(supabase, userId);
    const hintsShown = { ...current.progressive_hints_shown };

    hintsShown[hintId] = {
      shown_at: new Date().toISOString(),
      dismissed: false,
    };

    return this.update(supabase, userId, {
      progressive_hints_shown: hintsShown,
    });
  }

  /**
   * Mark a progressive hint as dismissed
   */
  async dismissHint(
    supabase: SupabaseClient,
    userId: string,
    hintId: string
  ): Promise<UserOnboarding> {
    const current = await this.getOrCreate(supabase, userId);
    const hintsShown = { ...current.progressive_hints_shown };

    if (hintsShown[hintId]) {
      hintsShown[hintId] = {
        ...hintsShown[hintId],
        dismissed: true,
      } as ProgressiveHintState;
    } else {
      hintsShown[hintId] = {
        shown_at: new Date().toISOString(),
        dismissed: true,
      };
    }

    return this.update(supabase, userId, {
      progressive_hints_shown: hintsShown,
    });
  }

  /**
   * Track a feature discovery
   */
  async trackFeatureDiscovery(
    supabase: SupabaseClient,
    userId: string,
    featureId: string
  ): Promise<UserOnboarding> {
    const current = await this.getOrCreate(supabase, userId);

    // Only track first discovery
    if (current.features_discovered[featureId]) {
      return current;
    }

    const featuresDiscovered = { ...current.features_discovered };
    featuresDiscovered[featureId] = new Date().toISOString();

    return this.update(supabase, userId, {
      features_discovered: featuresDiscovered,
    });
  }

  /**
   * Increment expense count for usage-based hints
   */
  async incrementExpenseCount(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserOnboarding> {
    const current = await this.getOrCreate(supabase, userId);
    const today = dateUtils.getCurrentDateString();

    // Track days active
    let daysActive = current.days_active;
    if (current.last_active_date !== today) {
      daysActive += 1;
    }

    return this.update(supabase, userId, {
      expense_count: current.expense_count + 1,
      days_active: daysActive,
      last_active_date: today,
    });
  }
}

// Export singleton instance
export const onboardingRepository = new OnboardingRepository();

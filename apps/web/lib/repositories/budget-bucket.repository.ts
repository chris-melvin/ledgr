import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BudgetBucket,
  BudgetBucketInsert,
  BudgetBucketUpdate,
  ExpenseBucketRule,
  ExpenseBucketRuleInsert,
} from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for budget bucket operations
 */
class BudgetBucketRepository extends BaseRepository<
  BudgetBucket,
  BudgetBucketInsert,
  BudgetBucketUpdate
> {
  protected tableName = "budget_buckets";

  /**
   * Find all buckets for a user, ordered by sort_order
   */
  async findAllOrdered(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as BudgetBucket[];
  }

  /**
   * Find the default bucket for a user (where expenses go by default)
   */
  async findDefault(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as BudgetBucket;
  }

  /**
   * Find bucket by slug
   */
  async findBySlug(
    supabase: SupabaseClient,
    userId: string,
    slug: string
  ): Promise<BudgetBucket | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as BudgetBucket;
  }

  /**
   * Set a bucket as the default (and unset all others) - ATOMIC
   * Uses PostgreSQL function to prevent race conditions where concurrent
   * calls could result in 0 or 2 default buckets
   */
  async setDefault(
    supabase: SupabaseClient,
    userId: string,
    bucketId: string
  ): Promise<void> {
    // Use atomic RPC function to ensure exactly one bucket is default
    const { error } = await supabase.rpc("set_default_bucket", {
      p_user_id: userId,
      p_bucket_id: bucketId,
    });

    if (error) {
      console.error("Failed to set default bucket atomically:", error);
      throw error;
    }
  }

  /**
   * Update bucket percentages (batch update)
   * @deprecated Use updateAllocations for better support of both percentage and target_amount
   */
  async updatePercentages(
    supabase: SupabaseClient,
    userId: string,
    updates: Array<{ id: string; percentage: number; allocated_amount?: number }>
  ): Promise<void> {
    // Update each bucket
    for (const update of updates) {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          percentage: update.percentage,
          allocated_amount: update.allocated_amount,
        })
        .eq("id", update.id)
        .eq("user_id", userId);

      if (error) throw error;
    }
  }

  /**
   * Update bucket allocations (batch update)
   * Supports both percentage-based and fixed target_amount allocations
   */
  async updateAllocations(
    supabase: SupabaseClient,
    userId: string,
    updates: Array<{
      id: string;
      percentage?: number | null;
      target_amount?: number | null;
      allocated_amount?: number | null;
      description?: string | null;
    }>
  ): Promise<void> {
    for (const update of updates) {
      const updateData: Record<string, unknown> = {};

      if (update.percentage !== undefined) {
        updateData.percentage = update.percentage;
      }
      if (update.target_amount !== undefined) {
        updateData.target_amount = update.target_amount;
      }
      if (update.allocated_amount !== undefined) {
        updateData.allocated_amount = update.allocated_amount;
      }
      if (update.description !== undefined) {
        updateData.description = update.description;
      }

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq("id", update.id)
        .eq("user_id", userId);

      if (error) throw error;
    }
  }

  /**
   * Calculate allocated amounts for all buckets based on remaining budget
   * Handles both percentage-based and fixed target_amount buckets
   */
  calculateAllocations(
    buckets: BudgetBucket[],
    remainingBudget: number
  ): Array<{ id: string; allocated_amount: number }> {
    // First, calculate fixed amounts (target_amount buckets)
    let fixedTotal = 0;
    const results: Array<{ id: string; allocated_amount: number }> = [];

    // Process fixed-amount buckets first
    for (const bucket of buckets) {
      if (bucket.target_amount != null && bucket.target_amount > 0) {
        const amount = Math.min(bucket.target_amount, remainingBudget - fixedTotal);
        fixedTotal += amount;
        results.push({ id: bucket.id, allocated_amount: amount });
      }
    }

    // Calculate remaining budget after fixed allocations
    const remainingAfterFixed = Math.max(0, remainingBudget - fixedTotal);

    // Process percentage-based buckets
    const percentageBuckets = buckets.filter(
      (b) => b.percentage != null && b.percentage > 0 && (b.target_amount == null || b.target_amount === 0)
    );
    const totalPercentage = percentageBuckets.reduce((sum, b) => sum + (b.percentage ?? 0), 0);

    for (const bucket of percentageBuckets) {
      const percentage = bucket.percentage ?? 0;
      // Normalize percentage if total != 100
      const normalizedPercentage = totalPercentage > 0 ? percentage / totalPercentage : 0;
      const amount = Math.round(remainingAfterFixed * normalizedPercentage);
      results.push({ id: bucket.id, allocated_amount: amount });
    }

    return results;
  }

  /**
   * Create default buckets for a new user
   * @deprecated New users should create custom buckets via the setup wizard
   * This method is kept for backward compatibility with older setups
   */
  async createDefaultBuckets(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket[]> {
    const defaultBuckets: BudgetBucketInsert[] = [
      {
        user_id: userId,
        name: "Savings",
        slug: "savings",
        percentage: 20,
        target_amount: null,
        color: "#22c55e",
        icon: "PiggyBank",
        is_default: false,
        is_system: true,
        sort_order: 0,
      },
      {
        user_id: userId,
        name: "Daily Spending",
        slug: "daily-spending",
        percentage: 80,
        target_amount: null,
        color: "#3b82f6",
        icon: "Wallet",
        is_default: true, // Default bucket for expenses
        is_system: true,
        sort_order: 1,
      },
    ];

    return this.createMany(supabase, defaultBuckets);
  }

  /**
   * Ensure the three tracking buckets exist for a tracking-only user.
   * Idempotent: only inserts buckets whose slug is missing.
   * Daily is the default bucket and the only one feeding daily averages.
   */
  async ensureTrackingBuckets(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket[]> {
    const existing = await this.findAllOrdered(supabase, userId);
    const existingSlugs = new Set(existing.map((b) => b.slug));
    const hasDefault = existing.some((b) => b.is_default);

    const trackingBuckets: BudgetBucketInsert[] = [
      {
        user_id: userId,
        name: "Daily",
        slug: "daily",
        description: "Everyday spending — feeds your daily average",
        color: "#3b82f6",
        icon: "Wallet",
        is_default: !hasDefault,
        is_system: true,
        include_in_daily_avg: true,
        sort_order: existing.length,
      },
      {
        user_id: userId,
        name: "Bills",
        slug: "bills",
        description: "Rent, utilities, subscriptions — excluded from daily average",
        color: "#f59e0b",
        icon: "Receipt",
        is_default: false,
        is_system: true,
        include_in_daily_avg: false,
        sort_order: existing.length + 1,
      },
      {
        user_id: userId,
        name: "Non-daily",
        slug: "non-daily",
        description: "Clothes, gear, irregular buys — excluded from daily average",
        color: "#8b5cf6",
        icon: "ShoppingBag",
        is_default: false,
        is_system: true,
        include_in_daily_avg: false,
        sort_order: existing.length + 2,
      },
    ];

    const missing = trackingBuckets.filter((b) => !existingSlugs.has(b.slug));
    if (missing.length === 0) return existing;

    const created = await this.createMany(supabase, missing);
    return [...existing, ...created];
  }

  /**
   * Create a single bucket from a suggestion template
   */
  async createFromSuggestion(
    supabase: SupabaseClient,
    userId: string,
    suggestion: {
      name: string;
      slug: string;
      description?: string;
      icon: string;
      color: string;
      percentage?: number | null;
      targetAmount?: number | null;
      isDefault?: boolean;
    }
  ): Promise<BudgetBucket> {
    // Get current bucket count for sort order
    const existingBuckets = await this.findAll(supabase, userId);
    const sortOrder = existingBuckets.length;

    const bucketInsert: BudgetBucketInsert = {
      user_id: userId,
      name: suggestion.name,
      slug: suggestion.slug,
      percentage: suggestion.percentage ?? null,
      target_amount: suggestion.targetAmount ?? null,
      description: suggestion.description ?? null,
      color: suggestion.color,
      icon: suggestion.icon,
      is_default: suggestion.isDefault ?? false,
      is_system: false, // Custom buckets are not system buckets
      sort_order: sortOrder,
    };

    const created = await this.create(supabase, bucketInsert);

    // If this bucket is set as default, update others
    if (suggestion.isDefault) {
      await this.setDefault(supabase, userId, created.id);
    }

    return created;
  }

  /**
   * Bulk create buckets (for setup wizard)
   */
  async createBulk(
    supabase: SupabaseClient,
    userId: string,
    buckets: Array<{
      name: string;
      slug: string;
      percentage?: number | null;
      targetAmount?: number | null;
      allocatedAmount?: number | null;
      description?: string | null;
      color: string;
      icon: string;
      isDefault?: boolean;
    }>
  ): Promise<BudgetBucket[]> {
    if (buckets.length === 0) return [];

    // Ensure exactly one bucket is marked as default
    const hasDefault = buckets.some((b) => b.isDefault);
    const bucketsToCreate = hasDefault
      ? buckets
      : buckets.map((b, i) => ({ ...b, isDefault: i === 0 })); // Default to first bucket

    const bucketInserts: BudgetBucketInsert[] = bucketsToCreate.map((bucket, index) => ({
      user_id: userId,
      name: bucket.name,
      slug: bucket.slug,
      percentage: bucket.percentage ?? null,
      target_amount: bucket.targetAmount ?? null,
      allocated_amount: bucket.allocatedAmount ?? null,
      description: bucket.description ?? null,
      color: bucket.color,
      icon: bucket.icon,
      is_default: bucket.isDefault ?? false,
      is_system: false,
      sort_order: index,
    }));

    return this.createMany(supabase, bucketInserts);
  }

  /**
   * Get total percentage allocation
   */
  async getTotalPercentage(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("percentage")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, b) => sum + Number(b.percentage), 0);
  }

  /**
   * Reorder buckets
   */
  async reorder(
    supabase: SupabaseClient,
    userId: string,
    bucketIds: string[]
  ): Promise<void> {
    for (let i = 0; i < bucketIds.length; i++) {
      const { error } = await supabase
        .from(this.tableName)
        .update({ sort_order: i })
        .eq("id", bucketIds[i])
        .eq("user_id", userId);

      if (error) throw error;
    }
  }

  /**
   * Check if user has completed bucket setup
   */
  async hasSetupBuckets(
    supabase: SupabaseClient,
    userId: string
  ): Promise<boolean> {
    const count = await this.count(supabase, userId);
    return count > 0;
  }

  /**
   * Deduct an amount from a bucket's allocated_amount
   * Used when recording debt payments with auto-deduct mode
   */
  async deductFromBucket(
    supabase: SupabaseClient,
    bucketId: string,
    userId: string,
    amount: number
  ): Promise<BudgetBucket | null> {
    // Get current bucket
    const bucket = await this.findById(supabase, bucketId, userId);
    if (!bucket) return null;

    // Calculate new allocated amount (cannot go below 0)
    const currentAllocated = bucket.allocated_amount ?? bucket.target_amount ?? 0;
    const newAllocated = Math.max(0, currentAllocated - amount);

    // Update bucket
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ allocated_amount: newAllocated })
      .eq("id", bucketId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as BudgetBucket;
  }
}

/**
 * Repository for expense bucket rule operations
 */
class ExpenseBucketRuleRepository {
  private tableName = "expense_bucket_rules";

  /**
   * Find all rules for a user, ordered by priority
   */
  async findAll(
    supabase: SupabaseClient,
    userId: string
  ): Promise<ExpenseBucketRule[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ExpenseBucketRule[];
  }

  /**
   * Find rules for a specific bucket
   */
  async findByBucket(
    supabase: SupabaseClient,
    userId: string,
    bucketId: string
  ): Promise<ExpenseBucketRule[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("bucket_id", bucketId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ExpenseBucketRule[];
  }

  /**
   * Create a new rule
   */
  async create(
    supabase: SupabaseClient,
    data: ExpenseBucketRuleInsert
  ): Promise<ExpenseBucketRule> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data as object)
      .select()
      .single();

    if (error) throw error;
    return created as ExpenseBucketRule;
  }

  /**
   * Delete a rule
   */
  async delete(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }

  /**
   * Find matching bucket for an expense based on rules
   * Returns the bucket_id that matches, or null if no match
   */
  async findMatchingBucket(
    supabase: SupabaseClient,
    userId: string,
    expense: { label: string; category?: string | null }
  ): Promise<string | null> {
    const rules = await this.findAll(supabase, userId);

    for (const rule of rules) {
      const matchValue = rule.match_value.toLowerCase();

      switch (rule.match_type) {
        case "label":
          if (expense.label.toLowerCase() === matchValue) {
            return rule.bucket_id;
          }
          break;
        case "keyword":
          if (expense.label.toLowerCase().includes(matchValue)) {
            return rule.bucket_id;
          }
          break;
        case "category":
          if (expense.category?.toLowerCase() === matchValue) {
            return rule.bucket_id;
          }
          break;
      }
    }

    return null; // No match, will use default bucket
  }
}

// Export singleton instances
export const budgetBucketRepository = new BudgetBucketRepository();
export const expenseBucketRuleRepository = new ExpenseBucketRuleRepository();

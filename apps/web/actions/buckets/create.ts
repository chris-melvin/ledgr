"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { budgetBucketRepository } from "@/lib/repositories";
import { DEFAULT_BUCKETS } from "@/lib/budget-setup/constants";
import type { BudgetBucketInsert } from "@repo/database";

interface CreateBucketParams {
  name: string;
  slug?: string;
  percentage?: number | null;
  targetAmount?: number | null; // Fixed monthly amount, alternative to percentage
  allocatedAmount?: number | null;
  color?: string;
  icon?: string;
  description?: string | null;
  isDefault?: boolean;
  /** Expenses in this bucket feed the trailing daily-spend averages */
  includeInDailyAvg?: boolean;
}

/**
 * Create a single bucket
 * Supports both percentage-based and fixed target_amount allocations
 */
export async function createBucket(params: CreateBucketParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const {
    name,
    slug,
    percentage,
    targetAmount,
    allocatedAmount,
    color,
    icon,
    description,
    isDefault = false,
    includeInDailyAvg = false,
  } = params;

  // Validate: bucket should have either percentage or targetAmount (or neither for manual allocation)
  if (percentage != null && targetAmount != null && percentage > 0 && targetAmount > 0) {
    throw new Error("Bucket cannot have both percentage and target amount. Choose one allocation method.");
  }

  // Generate slug from name if not provided
  const bucketSlug = slug ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Check if slug already exists
  const existing = await budgetBucketRepository.findBySlug(supabase, user.id, bucketSlug);
  if (existing) {
    throw new Error(`Bucket with slug "${bucketSlug}" already exists`);
  }

  // Get current bucket count for sort order
  const existingBuckets = await budgetBucketRepository.findAll(supabase, user.id);
  const sortOrder = existingBuckets.length;

  const bucketInsert: BudgetBucketInsert = {
    user_id: user.id,
    name,
    slug: bucketSlug,
    percentage: percentage ?? null,
    target_amount: targetAmount ?? null,
    allocated_amount: allocatedAmount ?? null,
    description: description ?? null,
    color: color ?? "#6b7280", // gray-500 default
    icon: icon ?? "Wallet",
    is_default: isDefault,
    is_system: false,
    include_in_daily_avg: includeInDailyAvg,
    sort_order: sortOrder,
  };

  const created = await budgetBucketRepository.create(supabase, bucketInsert);

  // If this bucket is set as default, unset others
  if (isDefault) {
    await budgetBucketRepository.setDefault(supabase, user.id, created.id);
  }

  revalidatePath("/");

  return { success: true, bucket: created };
}

/**
 * Create default buckets with flex (for quick setup/testing)
 * Uses the DEFAULT_BUCKETS from constants (includes flex)
 */
export async function createDefaultBucketsWithFlex(totalMonthlyBudget?: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user already has buckets
  const existingBuckets = await budgetBucketRepository.findAll(supabase, user.id);
  if (existingBuckets.length > 0) {
    throw new Error("User already has buckets. Delete existing buckets first or use createBucket.");
  }

  // Calculate allocated amounts if total budget provided
  const budget = totalMonthlyBudget ?? 0;

  const bucketInserts: BudgetBucketInsert[] = DEFAULT_BUCKETS.map((bucket, index) => ({
    user_id: user.id,
    name: bucket.name,
    slug: bucket.slug,
    percentage: bucket.percentage ?? null,
    target_amount: bucket.targetAmount ?? null,
    allocated_amount: budget > 0 && bucket.percentage != null
      ? Math.round((budget * bucket.percentage) / 100)
      : null,
    color: bucket.color,
    icon: bucket.icon,
    is_default: bucket.isDefault,
    is_system: bucket.isSystem,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from("budget_buckets")
    .insert(bucketInserts)
    .select();

  if (error) {
    console.error("Error creating default buckets:", error);
    throw error;
  }

  revalidatePath("/");

  return { success: true, buckets: data };
}

/**
 * Add a specific bucket by slug (e.g., "flex")
 * Useful for adding a missing bucket without resetting everything
 */
export async function addBucketBySlug(
  slug: "flex" | "savings" | "daily-spending",
  options?: { percentage?: number; allocatedAmount?: number }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Find the bucket definition from defaults
  const definition = DEFAULT_BUCKETS.find((b) => b.slug === slug);
  if (!definition) {
    throw new Error(`Unknown bucket slug: ${slug}`);
  }

  // Check if already exists
  const existing = await budgetBucketRepository.findBySlug(supabase, user.id, slug);
  if (existing) {
    return { success: true, bucket: existing, existed: true };
  }

  // Get sort order
  const existingBuckets = await budgetBucketRepository.findAll(supabase, user.id);
  const sortOrder = existingBuckets.length;

  const bucketInsert: BudgetBucketInsert = {
    user_id: user.id,
    name: definition.name,
    slug: definition.slug,
    percentage: options?.percentage ?? definition.percentage ?? null,
    target_amount: definition.targetAmount ?? null,
    allocated_amount: options?.allocatedAmount ?? null,
    color: definition.color,
    icon: definition.icon,
    is_default: definition.isDefault,
    is_system: definition.isSystem,
    sort_order: sortOrder,
  };

  const created = await budgetBucketRepository.create(supabase, bucketInsert);

  revalidatePath("/");

  return { success: true, bucket: created, existed: false };
}

/**
 * Delete a bucket by ID
 */
export async function deleteBucket(bucketId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await budgetBucketRepository.delete(supabase, bucketId, user.id);

  revalidatePath("/");

  return { success: true };
}

/**
 * Delete all buckets for current user (for testing/reset)
 */
export async function deleteAllBuckets() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("budget_buckets")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting buckets:", error);
    throw error;
  }

  revalidatePath("/");

  return { success: true };
}

/**
 * Update a bucket
 */
export async function updateBucket(
  bucketId: string,
  params: Partial<Omit<CreateBucketParams, "slug">>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Validate: bucket should have either percentage or targetAmount (or neither)
  if (
    params.percentage != null &&
    params.targetAmount != null &&
    params.percentage > 0 &&
    params.targetAmount > 0
  ) {
    throw new Error("Bucket cannot have both percentage and target amount. Choose one allocation method.");
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name;
  if (params.percentage !== undefined) updateData.percentage = params.percentage;
  if (params.targetAmount !== undefined) updateData.target_amount = params.targetAmount;
  if (params.allocatedAmount !== undefined) updateData.allocated_amount = params.allocatedAmount;
  if (params.color !== undefined) updateData.color = params.color;
  if (params.icon !== undefined) updateData.icon = params.icon;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.includeInDailyAvg !== undefined)
    updateData.include_in_daily_avg = params.includeInDailyAvg;

  const { data, error } = await supabase
    .from("budget_buckets")
    .update(updateData)
    .eq("id", bucketId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating bucket:", error);
    throw error;
  }

  // If this bucket is set as default, update others
  if (params.isDefault) {
    await budgetBucketRepository.setDefault(supabase, user.id, bucketId);
  }

  revalidatePath("/");

  return { success: true, bucket: data };
}

/**
 * Set a bucket as the default (where expenses are deducted from)
 */
export async function setDefaultBucket(bucketId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await budgetBucketRepository.setDefault(supabase, user.id, bucketId);

  revalidatePath("/");

  return { success: true };
}

/**
 * Reorder buckets
 */
export async function reorderBuckets(bucketIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await budgetBucketRepository.reorder(supabase, user.id, bucketIds);

  revalidatePath("/");

  return { success: true };
}

/**
 * Bulk create buckets (for setup wizard)
 */
export async function createBucketsFromWizard(
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
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Validate buckets
  for (const bucket of buckets) {
    if (
      bucket.percentage != null &&
      bucket.targetAmount != null &&
      bucket.percentage > 0 &&
      bucket.targetAmount > 0
    ) {
      throw new Error(`Bucket "${bucket.name}" cannot have both percentage and target amount.`);
    }
  }

  const created = await budgetBucketRepository.createBulk(supabase, user.id, buckets);

  revalidatePath("/");

  return { success: true, buckets: created };
}

/**
 * Get all buckets for current user
 */
export async function getBuckets() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const buckets = await budgetBucketRepository.findAllOrdered(supabase, user.id);

  return { success: true, buckets };
}

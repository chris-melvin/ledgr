/**
 * Access Control & Feature Gating
 *
 * Utilities for checking subscription and credit-based feature access.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionTier, AIFeatureId } from "@repo/database";
import { FEATURE_GATES, type GatedFeature } from "@/lib/payments";
import { subscriptionRepository, creditsRepository, settingsRepository } from "@/lib/repositories";

// =============================================================================
// TYPES
// =============================================================================

export type AccessDenialReason =
  | "subscription_required"
  | "insufficient_credits"
  | "feature_disabled";

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: AccessDenialReason;
  upgradePrompt?: {
    title: string;
    description: string;
    ctaText: string;
    ctaHref: string;
  };
}

export interface UserAccessState {
  subscription: {
    tier: SubscriptionTier;
    isActive: boolean;
    isPro: boolean;
  };
  credits: {
    balance: number;
    hasCredits: boolean;
  };
}

// =============================================================================
// FEATURE ACCESS CHECK
// =============================================================================

/**
 * Check if user has access to a specific feature
 * Used in server actions and API routes
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: GatedFeature
): Promise<AccessCheckResult> {
  const config = FEATURE_GATES[feature];

  if (!config) {
    // Unknown feature, deny by default
    return {
      hasAccess: false,
      reason: "feature_disabled",
    };
  }

  // Check subscription requirement
  if (config.requiredTier === "pro") {
    const isPro = await checkIsPro(supabase, userId);

    if (!isPro) {
      return {
        hasAccess: false,
        reason: "subscription_required",
        upgradePrompt: {
          ...config.upgradePrompt,
          ctaHref: "/pricing",
        },
      };
    }
  }

  // Check credits requirement
  if (config.creditsRequired) {
    const credits = await creditsRepository.getOrCreate(supabase, userId);

    if (credits.balance < config.creditsRequired) {
      return {
        hasAccess: false,
        reason: "insufficient_credits",
        upgradePrompt: {
          ...config.upgradePrompt,
          ctaHref: "/pricing",
        },
      };
    }
  }

  return { hasAccess: true };
}

/**
 * Check if user is a Pro subscriber
 * Uses the cached subscription_tier from user_settings for performance
 */
export async function checkIsPro(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  // First try the fast path: check user_settings.subscription_tier
  const settings = await settingsRepository.get(supabase, userId);

  if (settings) {
    const tier = (settings as { subscription_tier?: SubscriptionTier })
      .subscription_tier;
    if (tier === "pro") {
      // Double-check the subscription hasn't expired
      const subscription = await subscriptionRepository.getByUserId(
        supabase,
        userId
      );

      if (subscription) {
        const periodEnd = new Date(subscription.current_period_end);
        return periodEnd > new Date();
      }
    }
    return false;
  }

  // Fallback: check subscription directly
  return subscriptionRepository.hasActiveAccess(supabase, userId);
}

/**
 * Get the user's subscription tier
 */
export async function getSubscriptionTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  const isPro = await checkIsPro(supabase, userId);
  return isPro ? "pro" : "free";
}

// =============================================================================
// COMBINED ACCESS STATE
// =============================================================================

/**
 * Get full access state for user (subscription + credits)
 * Used for initial page loads to pass to client
 */
export async function getUserAccessState(
  supabase: SupabaseClient,
  userId: string
): Promise<UserAccessState> {
  const [isPro, credits] = await Promise.all([
    checkIsPro(supabase, userId),
    creditsRepository.getOrCreate(supabase, userId),
  ]);

  return {
    subscription: {
      tier: isPro ? "pro" : "free",
      isActive: isPro,
      isPro,
    },
    credits: {
      balance: credits.balance,
      hasCredits: credits.balance > 0,
    },
  };
}

// =============================================================================
// CREDITS CONSUMPTION (Server-side)
// =============================================================================

/**
 * Consume credits for a feature
 * Returns updated balance or null if insufficient
 */
export async function consumeCreditsForFeature(
  supabase: SupabaseClient,
  userId: string,
  featureId: AIFeatureId,
  description?: string
): Promise<{ success: boolean; balance: number }> {
  const config = FEATURE_GATES[featureId];
  const creditsRequired = config?.creditsRequired ?? 1;

  const result = await creditsRepository.consumeCredits(
    supabase,
    userId,
    creditsRequired,
    featureId,
    description ?? `Used ${config?.name ?? featureId}`
  );

  if (!result) {
    const credits = await creditsRepository.getOrCreate(supabase, userId);
    return { success: false, balance: credits.balance };
  }

  return { success: true, balance: result.balance };
}

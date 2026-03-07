"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { SubscriptionTier } from "@repo/database";
import { FEATURE_GATES, type GatedFeature } from "@/lib/payments";

// =============================================================================
// TYPES
// =============================================================================

export interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  isPro: boolean;
}

export interface CreditsState {
  balance: number;
  hasCredits: boolean;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: "subscription_required" | "insufficient_credits" | "feature_disabled";
  upgradePrompt?: {
    title: string;
    description: string;
    ctaText: string;
    ctaHref: string;
  };
}

export interface SubscriptionContextValue {
  subscription: SubscriptionState;
  credits: CreditsState;
  isLoading: boolean;
  checkAccess: (feature: GatedFeature) => AccessCheckResult;
  refreshStatus: () => Promise<void>;
  updateCredits: (newBalance: number) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export interface SubscriptionProviderProps {
  children: ReactNode;
  initialSubscription?: {
    tier: SubscriptionTier;
    isActive?: boolean;
  };
  initialCredits?: {
    balance: number;
  };
}

export function SubscriptionProvider({
  children,
  initialSubscription,
  initialCredits,
}: SubscriptionProviderProps) {
  const [isLoading, setIsLoading] = useState(!initialSubscription);

  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: initialSubscription?.tier ?? "free",
    isActive: initialSubscription?.isActive ?? initialSubscription?.tier === "pro",
    isPro:
      (initialSubscription?.isActive ?? initialSubscription?.tier === "pro") &&
      initialSubscription?.tier === "pro",
  });

  const [credits, setCredits] = useState<CreditsState>({
    balance: initialCredits?.balance ?? 0,
    hasCredits: (initialCredits?.balance ?? 0) > 0,
  });

  // Check access for a feature (client-side, uses cached state)
  const checkAccess = useCallback(
    (feature: GatedFeature): AccessCheckResult => {
      const config = FEATURE_GATES[feature];

      if (!config) {
        return { hasAccess: false, reason: "subscription_required" };
      }

      // Check subscription requirement
      if (config.requiredTier === "pro" && !subscription.isPro) {
        return {
          hasAccess: false,
          reason: "subscription_required",
          upgradePrompt: {
            ...config.upgradePrompt,
            ctaHref: "/pricing",
          },
        };
      }

      // Check credits requirement
      if (config.creditsRequired && credits.balance < config.creditsRequired) {
        return {
          hasAccess: false,
          reason: "insufficient_credits",
          upgradePrompt: {
            ...config.upgradePrompt,
            ctaHref: "/pricing",
          },
        };
      }

      return { hasAccess: true };
    },
    [subscription.isPro, credits.balance]
  );

  // Refresh status from server
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/status");
      if (response.ok) {
        const data = await response.json();
        setSubscription({
          tier: data.subscription.tier,
          isActive: data.subscription.isActive,
          isPro: data.subscription.isPro,
        });
        setCredits({
          balance: data.credits.balance,
          hasCredits: data.credits.balance > 0,
        });
      }
    } catch (err) {
      console.error("Failed to refresh subscription status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update credits (optimistic update after consumption)
  const updateCredits = useCallback((newBalance: number) => {
    setCredits({
      balance: newBalance,
      hasCredits: newBalance > 0,
    });
  }, []);

  const value = useMemo(
    () => ({
      subscription,
      credits,
      isLoading,
      checkAccess,
      refreshStatus,
      updateCredits,
    }),
    [subscription, credits, isLoading, checkAccess, refreshStatus, updateCredits]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Use subscription context
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

/**
 * Check access for a specific feature
 */
export function useFeatureAccess(feature: GatedFeature) {
  const { checkAccess, isLoading } = useSubscription();

  return useMemo(
    () => ({
      ...checkAccess(feature),
      isLoading,
    }),
    [checkAccess, feature, isLoading]
  );
}

/**
 * Get just the subscription state
 */
export function useSubscriptionState() {
  const { subscription, isLoading } = useSubscription();
  return { ...subscription, isLoading };
}

/**
 * Get just the credits state
 */
export function useCreditsState() {
  const { credits, updateCredits, isLoading } = useSubscription();
  return { ...credits, updateCredits, isLoading };
}

/**
 * Check if user is Pro
 */
export function useIsPro() {
  const { subscription, isLoading } = useSubscription();
  return { isPro: subscription.isPro, isLoading };
}

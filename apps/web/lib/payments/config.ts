/**
 * Payment & Subscription Configuration
 *
 * All payment-related constants and configuration.
 * Price IDs come from environment variables.
 */

import type { PaymentProvider as ProviderName, AIFeatureId, SubscriptionTier } from "@repo/database";

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

/**
 * Active payment provider (set via environment variable)
 */
export const PAYMENT_PROVIDER: ProviderName =
  (process.env.PAYMENT_PROVIDER as ProviderName) ?? "paddle";

/**
 * Paddle configuration
 */
export const PADDLE_CONFIG = {
  apiKey: process.env.PADDLE_API_KEY ?? "",
  vendorId: process.env.PADDLE_VENDOR_ID ?? "",
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
  monthlyPriceId: process.env.PADDLE_MONTHLY_PRICE_ID ?? "",
  yearlyPriceId: process.env.PADDLE_YEARLY_PRICE_ID ?? "",
  environment: (process.env.PADDLE_ENVIRONMENT ?? "sandbox") as "sandbox" | "production",
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
} as const;

// =============================================================================
// DISPLAY PRICING (Philippine Market - PHP)
// =============================================================================

/**
 * Pricing for display purposes only.
 * Actual prices are configured in the Paddle dashboard.
 */
export const PRICING_DISPLAY = {
  pro: {
    monthly: {
      amount: 250,
      currency: "PHP",
      formatted: "₱250",
      period: "month",
    },
    yearly: {
      amount: 2500,
      currency: "PHP",
      formatted: "₱2,500",
      period: "year",
      monthlyEquivalent: "₱208",
      savings: "₱500",
      savingsPercent: 17,
    },
  },
} as const;

/**
 * LemonSqueezy configuration
 */
export const LEMONSQUEEZY_CONFIG = {
  apiKey: process.env.LEMONSQUEEZY_API_KEY ?? "",
  storeId: process.env.LEMONSQUEEZY_STORE_ID ?? "",
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "",
  monthlyVariantId: process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID ?? "",
  yearlyVariantId: process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID ?? "",
} as const;

// =============================================================================
// SUBSCRIPTION TIERS
// =============================================================================

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  creditsPerMonth: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    creditsPerMonth: 0,
    features: [
      "Expense tracking",
      "Budget setup & management",
      "Income & bill tracking",
      "Basic dashboard",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    creditsPerMonth: 0,
    features: [
      "Everything in Free",
      "Advanced analytics & visualizations",
      "Export to CSV & PDF",
      "Priority support",
    ],
  },
} as const;

// =============================================================================
// CREDIT PACKS
// =============================================================================

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  paddlePriceId?: string;
  lemonsqueezyVariantId?: string;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_25",
    name: "Starter Pack",
    credits: 25,
    priceInCents: 299,
    paddlePriceId: process.env.PADDLE_CREDIT_PACK_25_PRICE_ID,
    lemonsqueezyVariantId: process.env.LEMONSQUEEZY_CREDIT_PACK_25_VARIANT_ID,
  },
  {
    id: "pack_75",
    name: "Value Pack",
    credits: 75,
    priceInCents: 699,
    paddlePriceId: process.env.PADDLE_CREDIT_PACK_75_PRICE_ID,
    lemonsqueezyVariantId: process.env.LEMONSQUEEZY_CREDIT_PACK_75_VARIANT_ID,
    popular: true,
  },
  {
    id: "pack_200",
    name: "Power Pack",
    credits: 200,
    priceInCents: 1499,
    paddlePriceId: process.env.PADDLE_CREDIT_PACK_200_PRICE_ID,
    lemonsqueezyVariantId: process.env.LEMONSQUEEZY_CREDIT_PACK_200_VARIANT_ID,
  },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

/**
 * Get credit pack by ID
 */
export function getCreditPack(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === packId);
}

// =============================================================================
// AI FEATURE COSTS
// =============================================================================

export interface AIFeatureConfig {
  id: AIFeatureId;
  name: string;
  description: string;
  creditCost: number;
}

export const AI_FEATURE_COSTS: Record<AIFeatureId, AIFeatureConfig> = {
  insights: {
    id: "insights",
    name: "AI Insights",
    description: "Get personalized spending insights",
    creditCost: 1,
  },
  budget_improvement: {
    id: "budget_improvement",
    name: "Budget Improvement Plan",
    description: "AI-generated budget optimization suggestions",
    creditCost: 3,
  },
  expense_analysis: {
    id: "expense_analysis",
    name: "Expense Analysis",
    description: "Deep analysis of spending patterns",
    creditCost: 2,
  },
  savings_recommendations: {
    id: "savings_recommendations",
    name: "Savings Recommendations",
    description: "Personalized savings strategies",
    creditCost: 2,
  },
} as const;

/**
 * Get credit cost for an AI feature
 */
export function getAIFeatureCost(featureId: AIFeatureId): number {
  return AI_FEATURE_COSTS[featureId]?.creditCost ?? 1;
}

// =============================================================================
// FEATURE GATING
// =============================================================================

export type GatedFeature =
  | "analytics"
  | "export_csv"
  | "export_pdf"
  | AIFeatureId;

export interface FeatureGateConfig {
  feature: GatedFeature;
  requiredTier?: SubscriptionTier;
  creditsRequired?: number;
  name: string;
  upgradePrompt: {
    title: string;
    description: string;
    ctaText: string;
  };
}

export const FEATURE_GATES: Record<GatedFeature, FeatureGateConfig> = {
  analytics: {
    feature: "analytics",
    requiredTier: "pro",
    name: "Analytics",
    upgradePrompt: {
      title: "Unlock Analytics",
      description:
        "Get detailed spending visualizations, cash flow diagrams, and trend analysis with ledgr Pro.",
      ctaText: "Upgrade to Pro",
    },
  },
  export_csv: {
    feature: "export_csv",
    requiredTier: "pro",
    name: "CSV Export",
    upgradePrompt: {
      title: "Export Your Data",
      description: "Download your expenses as CSV for spreadsheets and tax reporting.",
      ctaText: "Upgrade to Pro",
    },
  },
  export_pdf: {
    feature: "export_pdf",
    requiredTier: "pro",
    name: "PDF Reports",
    upgradePrompt: {
      title: "Generate Reports",
      description: "Create beautiful PDF reports of your spending and budget.",
      ctaText: "Upgrade to Pro",
    },
  },
  insights: {
    feature: "insights",
    creditsRequired: AI_FEATURE_COSTS.insights.creditCost,
    name: "AI Insights",
    upgradePrompt: {
      title: "Credits Required",
      description: `You need ${AI_FEATURE_COSTS.insights.creditCost} credit to use AI Insights.`,
      ctaText: "Get Credits",
    },
  },
  budget_improvement: {
    feature: "budget_improvement",
    creditsRequired: AI_FEATURE_COSTS.budget_improvement.creditCost,
    name: "Budget Improvement",
    upgradePrompt: {
      title: "Credits Required",
      description: `You need ${AI_FEATURE_COSTS.budget_improvement.creditCost} credits for Budget Improvement Plan.`,
      ctaText: "Get Credits",
    },
  },
  expense_analysis: {
    feature: "expense_analysis",
    creditsRequired: AI_FEATURE_COSTS.expense_analysis.creditCost,
    name: "Expense Analysis",
    upgradePrompt: {
      title: "Credits Required",
      description: `You need ${AI_FEATURE_COSTS.expense_analysis.creditCost} credits for Expense Analysis.`,
      ctaText: "Get Credits",
    },
  },
  savings_recommendations: {
    feature: "savings_recommendations",
    creditsRequired: AI_FEATURE_COSTS.savings_recommendations.creditCost,
    name: "Savings Recommendations",
    upgradePrompt: {
      title: "Credits Required",
      description: `You need ${AI_FEATURE_COSTS.savings_recommendations.creditCost} credits for Savings Recommendations.`,
      ctaText: "Get Credits",
    },
  },
} as const;

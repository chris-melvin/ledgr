import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "./auth-provider";
import { storage } from "@/lib/storage/mmkv";

type SubscriptionStatus = "active" | "trialing" | "past_due" | "paused" | "cancelled" | "expired";

interface SubscriptionInfo {
  status: SubscriptionStatus;
  billingCycle: "monthly" | "yearly" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionContextType {
  isPro: boolean;
  subscription: SubscriptionInfo | null;
  canAccess: (feature: ProFeature) => boolean;
  refresh: () => Promise<void>;
}

export type ProFeature =
  | "insights_full"
  | "pro_themes"
  | "pro_backgrounds"
  | "pro_materials"
  | "advanced_parser"
  | "export_data";

const MMKV_KEY = "subscription_info";

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function loadCached(): SubscriptionInfo | null {
  const raw = storage.getString(MMKV_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    () => loadCached()
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    const row = await db.getFirstAsync<{
      status: string;
      billing_cycle: string | null;
      current_period_end: string | null;
      cancel_at_period_end: number;
    }>(
      `SELECT status, billing_cycle, current_period_end, cancel_at_period_end
       FROM subscriptions WHERE user_id = ?`,
      [user.id]
    );

    if (row) {
      const info: SubscriptionInfo = {
        status: row.status as SubscriptionStatus,
        billingCycle: row.billing_cycle as "monthly" | "yearly" | null,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end === 1,
      };
      setSubscription(info);
      storage.set(MMKV_KEY, JSON.stringify(info));
    }
  }, [db, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // All features unlocked — no paywall
  const isPro = true;

  const canAccess = useCallback(
    (_feature: ProFeature) => true,
    []
  );

  return (
    <SubscriptionContext.Provider value={{ isPro, subscription, canAccess, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}

export function useIsPro(): boolean {
  return useSubscription().isPro;
}

export function useFeatureAccess(feature: ProFeature): boolean {
  return useSubscription().canAccess(feature);
}

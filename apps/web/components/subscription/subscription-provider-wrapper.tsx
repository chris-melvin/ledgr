"use client";

import { SubscriptionProvider, type SubscriptionProviderProps } from "@/hooks/use-subscription";

export function SubscriptionProviderWrapper({
  children,
  initialSubscription,
  initialCredits,
}: SubscriptionProviderProps) {
  return (
    <SubscriptionProvider
      initialSubscription={initialSubscription}
      initialCredits={initialCredits}
    >
      {children}
    </SubscriptionProvider>
  );
}

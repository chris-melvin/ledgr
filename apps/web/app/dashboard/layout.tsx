import { createClient } from "@/lib/supabase/server";
import { getUserAccessState } from "@/lib/access-control";
import { SubscriptionProviderWrapper } from "@/components/subscription/subscription-provider-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <>{children}</>;
  }

  let accessState;
  try {
    accessState = await getUserAccessState(supabase, user.id);
  } catch {
    // Graceful fallback if access state fetch fails
    accessState = {
      subscription: { tier: "free" as const, isActive: false, isPro: false },
      credits: { balance: 0, hasCredits: false },
    };
  }

  return (
    <SubscriptionProviderWrapper
      initialSubscription={accessState.subscription}
      initialCredits={accessState.credits}
    >
      {children}
    </SubscriptionProviderWrapper>
  );
}

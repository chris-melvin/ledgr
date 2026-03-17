import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { settingsRepository, budgetBucketRepository } from "@/lib/repositories";
import { getSubscription } from "@/actions/subscriptions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel data fetches — no sequential waterfall
  const [userSettings, buckets, subscriptionResult] = await Promise.all([
    settingsRepository.getOrCreate(supabase, user.id),
    budgetBucketRepository.findAllOrdered(supabase, user.id),
    getSubscription(),
  ]);

  const subscription = subscriptionResult.success ? subscriptionResult.data : null;
  const { tab } = await searchParams;

  return (
    <SettingsClient
      userSettings={userSettings}
      userEmail={user.email ?? ""}
      subscription={subscription}
      buckets={buckets}
      initialTab={tab ?? "general"}
    />
  );
}

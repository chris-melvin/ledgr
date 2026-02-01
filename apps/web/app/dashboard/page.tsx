import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { OnboardingProvider, OnboardingTour } from "@/components/onboarding";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";
import { settingsRepository, budgetBucketRepository, incomeRepository, billRepository } from "@/lib/repositories";
import type { Expense, UserOnboarding, UserSettings, BudgetBucket, Income, Debt } from "@repo/database";
import * as dateUtils from "@/lib/utils/date";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  let expenses: Expense[] = [];
  let onboardingState: UserOnboarding | null = null;
  let userSettings: UserSettings | null = null;
  let buckets: BudgetBucket[] = [];
  let incomes: Income[] = [];
  let bills: Debt[] = [];
  let shouldRedirectToSetup = false;

  // Fetch user settings
  try {
    userSettings = await settingsRepository.getOrCreate(supabase, user.id);

    // Check if we need to redirect to setup
    // Only redirect if:
    // 1. User has enabled budget mode (tracking_mode = "budget_enabled")
    // 2. Budget setup is not completed
    // 3. UI tour is complete (or skipped)
    const isBudgetModeEnabled = userSettings.tracking_mode === "budget_enabled";
    if (isBudgetModeEnabled && !userSettings.budget_setup_completed) {
      const onboarding = await onboardingRepository.getOrCreate(supabase, user.id);
      if (onboarding.has_completed_tour || onboarding.tour_skipped_at) {
        shouldRedirectToSetup = true;
      }
    }
  } catch (err) {
    // Settings table might not have new columns yet, continue without redirect
    console.warn("User settings not available:", err);
  }

  // Redirect outside try-catch (redirect throws NEXT_REDIRECT which must not be caught)
  if (shouldRedirectToSetup) {
    redirect("/setup");
  }

  // Fetch expenses for current month
  // Use user's timezone from settings, fallback to UTC
  const timezone = userSettings?.timezone ?? dateUtils.DEFAULT_TIMEZONE;
  const currentTimestamp = dateUtils.getCurrentTimestamp(timezone);

  // Get timestamp range for the current month in user's timezone
  const monthStart = dateUtils.getStartOfMonth(currentTimestamp, timezone);
  const monthEnd = dateUtils.getEndOfMonth(currentTimestamp, timezone);

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("occurred_at", monthStart)
    .lte("occurred_at", monthEnd)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!error && data) {
    expenses = data as Expense[];
  }

  // Fetch budget buckets
  try {
    buckets = await budgetBucketRepository.findAll(supabase, user.id);
    console.log("[dashboard/page.tsx] Fetched buckets:", buckets.length, buckets.map(b => b.slug));
  } catch (err) {
    console.warn("Budget buckets not available:", err);
  }

  // Fetch incomes and bills
  try {
    incomes = await incomeRepository.findActive(supabase, user.id);
  } catch (err) {
    console.warn("Incomes not available:", err);
  }

  try {
    bills = await billRepository.findActive(supabase, user.id);
  } catch (err) {
    console.warn("Bills not available:", err);
  }

  // Fetch onboarding state (creates default if new user)
  try {
    onboardingState = await onboardingRepository.getOrCreate(supabase, user.id);
  } catch (err) {
    // Onboarding table might not exist yet, continue without it
    console.warn("Onboarding state not available:", err);
  }

  return (
    <OnboardingProvider initialState={onboardingState}>
      <DashboardClient
        initialExpenses={expenses}
        dailyLimit={userSettings?.default_daily_limit}
        initialBuckets={buckets}
        initialIncomes={incomes}
        initialBills={bills}
        trackingMode={userSettings?.tracking_mode || "tracking_only"}
      />
      <OnboardingTour />
    </OnboardingProvider>
  );
}

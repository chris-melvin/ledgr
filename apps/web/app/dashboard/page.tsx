import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { TimezoneProvider } from "@/components/providers";
import { settingsRepository } from "@/lib/repositories";
import type { Expense, UserSettings } from "@repo/database";
import type { CardPreferences } from "@/components/dashboard/hero-card/card-theme";
import * as dateUtils from "@/lib/utils/date";

export default async function DashboardPage() {
  const { supabase, user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  let expenses: Expense[] = [];
  let userSettings: UserSettings | null = null;

  // Fetch user settings
  try {
    userSettings = await settingsRepository.getOrCreate(supabase, user.id);
  } catch (err) {
    console.warn("User settings not available:", err);
  }

  // Use user's timezone from settings, fallback to UTC
  const timezone = userSettings?.timezone ?? dateUtils.DEFAULT_TIMEZONE;
  const currentTimestamp = dateUtils.getCurrentTimestamp(timezone);

  // Include previous month so week navigation across month boundaries works
  const prevMonthStart = dateUtils.getStartOfMonth(
    dateUtils.subtractMonthsFromTimestamp(currentTimestamp, 1, timezone),
    timezone
  );
  const monthEnd = dateUtils.getEndOfMonth(currentTimestamp, timezone);

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("occurred_at", prevMonthStart)
    .lte("occurred_at", monthEnd)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!error && data) {
    expenses = data as Expense[];
  }

  // Extract card preferences from settings (JSONB column, defaults to {})
  const cardPreferences = (userSettings?.card_preferences ?? {}) as CardPreferences;

  return (
    <TimezoneProvider initialTimezone={timezone}>
      <DashboardClient
        initialExpenses={expenses}
        dailyLimit={userSettings?.default_daily_limit}
        trackingMode={userSettings?.tracking_mode ?? "tracking_only"}
        cardPreferences={cardPreferences}
      />
    </TimezoneProvider>
  );
}

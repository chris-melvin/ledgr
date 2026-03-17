"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { GeneralSettings } from "@/components/settings/general-settings";
import { BudgetSettings } from "@/components/settings/budget-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { DataSettings } from "@/components/settings/data-settings";
import type { UserSettings, BudgetBucket } from "@repo/database";
import type { SubscriptionInfo } from "@/actions/subscriptions/get-subscription";

interface SettingsClientProps {
  userSettings: UserSettings;
  userEmail: string;
  subscription: SubscriptionInfo | null;
  buckets?: BudgetBucket[];
  initialTab?: string;
}

export function SettingsClient({
  userSettings,
  userEmail,
  subscription,
  buckets = [],
  initialTab = "general",
}: SettingsClientProps) {
  const [currentTab, setCurrentTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    window.history.replaceState(null, "", `/dashboard/settings?tab=${value}`);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="sticky top-0 z-10 h-14 px-4 flex items-center gap-3 border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-stone-900">Settings</h1>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-4 pb-20">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <GeneralSettings userSettings={userSettings} />
          </TabsContent>

          <TabsContent value="budget" className="mt-0">
            <BudgetSettings userSettings={userSettings} buckets={buckets} />
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <AccountSettings
              userEmail={userEmail}
              subscription={subscription}
            />
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <DataSettings />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster position="bottom-center" />
    </div>
  );
}

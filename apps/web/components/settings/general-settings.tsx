"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { updateSettings } from "@/actions/settings";
import type { UserSettings } from "@repo/database";

interface GeneralSettingsProps {
  userSettings: UserSettings;
}

const CURRENCIES = [
  { value: "PHP", label: "PHP - Philippine Peso" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "KRW", label: "KRW - South Korean Won" },
];

const TIMEZONES = [
  { value: "Asia/Manila", label: "Manila (GMT+8)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (GMT+8)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "America/Chicago", label: "Chicago (CST)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export function GeneralSettings({ userSettings }: GeneralSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currency, setCurrency] = useState(userSettings.currency);
  const [timezone, setTimezone] = useState(userSettings.timezone);
  const [weekStartsOn, setWeekStartsOn] = useState(String(userSettings.week_starts_on));
  const [showSavings, setShowSavings] = useState(userSettings.show_savings_in_allocation);
  const [trackingMode, setTrackingMode] = useState(userSettings.tracking_mode);

  const hasChanges =
    currency !== userSettings.currency ||
    timezone !== userSettings.timezone ||
    weekStartsOn !== String(userSettings.week_starts_on) ||
    showSavings !== userSettings.show_savings_in_allocation ||
    trackingMode !== userSettings.tracking_mode;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettings({
        currency,
        timezone,
        week_starts_on: parseInt(weekStartsOn, 10),
        show_savings_in_allocation: showSavings,
        tracking_mode: trackingMode,
      });

      if (result.success) {
        toast.success("Settings saved successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save settings");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tracking Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Mode</CardTitle>
          <CardDescription>
            Choose how you want to use useMargin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={trackingMode}
            onValueChange={(value) => setTrackingMode(value as "tracking_only" | "budget_enabled")}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
              <RadioGroupItem value="tracking_only" id="tracking" className="mt-1" />
              <div className="flex-1 space-y-1 cursor-pointer" onClick={() => setTrackingMode("tracking_only")}>
                <Label htmlFor="tracking" className="font-semibold cursor-pointer">
                  Simple Tracking
                </Label>
                <p className="text-sm text-stone-500">
                  Track your expenses without budget limits. Perfect for building awareness and reviewing spending patterns.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
              <RadioGroupItem value="budget_enabled" id="budget" className="mt-1" />
              <div className="flex-1 space-y-1 cursor-pointer" onClick={() => setTrackingMode("budget_enabled")}>
                <Label htmlFor="budget" className="font-semibold cursor-pointer">
                  Budget Mode
                </Label>
                <p className="text-sm text-stone-500">
                  Set daily budgets, track buckets, and get alerts when approaching limits. Ideal for strict budget management.
                </p>
              </div>
            </div>
          </RadioGroup>
          {trackingMode === "budget_enabled" && !userSettings.budget_setup_completed && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                You'll be redirected to complete your budget setup after saving.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how information is displayed in the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-stone-500">
              Currency used to display amounts throughout the app
            </p>
          </div>

          <Separator />

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-stone-500">
              Used to determine the current day and week boundaries
            </p>
          </div>

          <Separator />

          {/* Week Starts On */}
          <div className="space-y-3">
            <Label>Week Starts On</Label>
            <RadioGroup
              value={weekStartsOn}
              onValueChange={setWeekStartsOn}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="sunday" />
                <Label htmlFor="sunday" className="font-normal cursor-pointer">
                  Sunday
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="monday" />
                <Label htmlFor="monday" className="font-normal cursor-pointer">
                  Monday
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-stone-500">
              Affects how weekly summaries and patterns are calculated
            </p>
          </div>

          <Separator />

          {/* Show Savings Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="show-savings">Show Savings in Allocation</Label>
              <p className="text-xs text-stone-500">
                Display savings allocation in the income breakdown chart
              </p>
            </div>
            <Switch
              id="show-savings"
              checked={showSavings}
              onCheckedChange={setShowSavings}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className="min-w-[120px]"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

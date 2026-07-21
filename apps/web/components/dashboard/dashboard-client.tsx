"use client";

import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import Link from "next/link";
import { Settings, MessageSquarePlus, Trash2, TableProperties } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isSameDay } from "date-fns";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { WeekStrip } from "@/components/calendar/week-strip";
import { SmartInputBar } from "@/components/expenses/smart-input-bar";
import { RegisterMode } from "@/components/expenses/register-mode";
import { CommandPalette } from "@/components/dashboard/command-palette";
import {
  LedgerActionDialog,
  type LedgerActionMode,
} from "@/components/dashboard/ledger-action-dialog";
import { ScheduleDialog } from "@/components/dashboard/schedule-dialog";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { SuccessFlash } from "@/components/ui/success-flash";

import { useServerExpenses } from "@/hooks/use-server-expenses";
import { useAiParser } from "@/hooks/use-ai-parser";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useSpendingStats } from "@/hooks/use-spending-stats";
import { HeroDailyCard } from "@/components/dashboard/hero-daily-card";
import { TrackingHeroCard } from "@/components/dashboard/tracking-hero-card";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import {
  showExpenseDeletedToast,
  showLedgerAppendOnlyToast,
} from "@/components/ui/undo-toast";
import { restoreExpense } from "@/actions/expenses/restore";
import { createLedgerInflow } from "@/actions/ledger";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT, CURRENCY } from "@/lib/constants";
import type {
  BudgetBucket,
  Expense,
  LedgerEvent,
  TrackingMode,
} from "@repo/database";
import type { ParsedExpense } from "@/hooks/use-ai-parser";
import type { SpendingStats } from "@/actions/ledger";
import type { CardPreferences } from "@/components/dashboard/hero-card/card-theme";

const InsightsTab = lazy(() =>
  import("@/components/insights/insights-tab").then((m) => ({
    default: m.InsightsTab,
  }))
);

interface DashboardClientProps {
  initialExpenses: Expense[];
  dailyLimit?: number;
  trackingMode?: TrackingMode;
  cardPreferences?: CardPreferences;
  buckets?: BudgetBucket[];
  initialLedgerEvents?: LedgerEvent[];
  initialStats?: SpendingStats | null;
}

const LEDGER_EVENT_LABELS: Record<LedgerEvent["type"], string> = {
  opening_balance: "Opening balance",
  income: "Income",
  savings_withdrawal: "From savings",
  savings_contribution: "To savings",
  adjustment: "Adjustment",
};

function cnLedgerAmount(amount: number): string {
  return `text-sm font-semibold tabular-nums flex-shrink-0 ${
    amount >= 0 ? "text-emerald-600" : "text-neutral-700"
  }`;
}

export function DashboardClient({
  initialExpenses,
  dailyLimit,
  trackingMode = "tracking_only",
  cardPreferences,
  buckets = [],
  initialLedgerEvents = [],
  initialStats = null,
}: DashboardClientProps) {
  const { timezone } = useTimezone();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Added!");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [ledgerAction, setLedgerAction] = useState<LedgerActionMode | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [smartInputTrigger, setSmartInputTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("today");

  const actualDailyLimit = dailyLimit ?? DEFAULT_DAILY_LIMIT;
  const isBudgetMode = trackingMode === "budget_enabled";

  // Server-backed expenses with optimistic updates
  const { expenses, addExpenses, updateExpense, removeExpense } =
    useServerExpenses(initialExpenses);

  const { shortcuts } = useShortcuts();

  // Running balance + trailing spend stats (tracking mode)
  const { stats, refresh: refreshStats } = useSpendingStats(initialStats);

  const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);

  // Buckets whose expenses feed the daily average (Daily; null bucket = fallback)
  const avgBucketIds = useMemo(
    () => new Set(buckets.filter((b) => b.include_in_daily_avg).map((b) => b.id)),
    [buckets]
  );

  const bucketById = useMemo(
    () => new Map(buckets.map((b) => [b.id, b])),
    [buckets]
  );

  // Today's Daily-bucket total, computed client-side so optimistic adds show instantly
  const todayDailyTotal = useMemo(() => {
    const todayKey = dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");
    return expenses
      .filter((e) => {
        const key = dateUtils.formatInTimezone(new Date(e.occurred_at), timezone, "yyyy-MM-dd");
        return (
          key === todayKey &&
          (e.bucket_id === null || avgBucketIds.has(e.bucket_id))
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, timezone, avgBucketIds]);

  // Ledger events on the selected day (history line items, tracking mode)
  const selectedDayLedgerEvents = useMemo(() => {
    const selectedKey = dateUtils.formatInTimezone(selectedDate, timezone, "yyyy-MM-dd");
    return initialLedgerEvents.filter((ev) => {
      const key = dateUtils.formatInTimezone(new Date(ev.occurred_at), timezone, "yyyy-MM-dd");
      return key === selectedKey;
    });
  }, [initialLedgerEvents, selectedDate, timezone]);

  // Selected day expenses (full Expense objects for the list)
  const selectedDayExpenses = useMemo(() => {
    const selectedKey = dateUtils.formatInTimezone(selectedDate, timezone, "yyyy-MM-dd");
    return expenses.filter((e) => {
      const expenseKey = dateUtils.formatInTimezone(new Date(e.occurred_at), timezone, "yyyy-MM-dd");
      return expenseKey === selectedKey;
    });
  }, [expenses, selectedDate, timezone]);

  // Selected day status for hero card
  const selectedDayStatus = useMemo(() => {
    const spent = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      spent,
      remaining: actualDailyLimit - spent,
      limit: actualDailyLimit,
    };
  }, [selectedDayExpenses, actualDailyLimit]);

  // Simplified expense items for hero card display
  const heroExpenses = useMemo(
    () => selectedDayExpenses.map((e) => ({ label: e.label, amount: e.amount })),
    [selectedDayExpenses]
  );

  // AI Parser
  const handleAiAddExpenses = useCallback(
    async (
      parsedExpenses: Array<ParsedExpense>
    ) => {
      const firstParsed = parsedExpenses[0];
      const parsedTime = firstParsed?.parsedTime;

      // Determine target date: parsed date (e.g., "yesterday") overrides selected date
      const targetDate = parsedTime?.date ?? selectedDate;
      const targetIsToday = isSameDay(targetDate, new Date());

      let timestamp: string;
      if (parsedTime?.hours !== undefined) {
        // User specified exact time (e.g., "at 2pm")
        const d = new Date(targetDate);
        d.setHours(parsedTime.hours, parsedTime.minutes ?? 0, 0, 0);
        timestamp = dateUtils.toTimestamp(d, timezone);
      } else if (targetIsToday) {
        // Today: use current time
        timestamp = dateUtils.getCurrentTimestamp(timezone);
      } else {
        // Past day: use current wall-clock time applied to that date
        const now = new Date();
        const d = new Date(targetDate);
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
        timestamp = dateUtils.toTimestamp(d, timezone);
      }

      const result = await addExpenses(parsedExpenses, timestamp);
      if (!result.success) return;

      refreshStats();

      const firstExpense = parsedExpenses[0];
      setSuccessMessage(
        parsedExpenses.length === 1 && firstExpense
          ? `${firstExpense.label} added!`
          : `${parsedExpenses.length} expenses added!`
      );
      setShowSuccessFlash(true);
    },
    [addExpenses, timezone, selectedDate, refreshStats]
  );

  const {
    preview,
    isParsing,
    updatePreview,
    updatePreviewItem,
    removePreviewItem,
    submit,
    submitPreview,
    defaultBucket,
  } = useAiParser({
    onSuccess: handleAiAddExpenses,
    shortcuts,
    buckets,
  });

  // Top-up from the smart input ("+5000 gcash") → running-balance inflow
  const handleTopUp = useCallback(
    async (amount: number, note: string | null) => {
      const result = await createLedgerInflow({ type: "income", amount, note });
      if (result.success) {
        refreshStats();
        setSuccessMessage(`Topped up ${formatCurrency(amount, CURRENCY)}!`);
        setShowSuccessFlash(true);
      }
    },
    [refreshStats]
  );

  const handleDeleteExpense = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    const expenseLabel = expense?.label || "Expense";
    await removeExpense(id);
    refreshStats();
    showExpenseDeletedToast(expenseLabel, async () => {
      await restoreExpense(id);
      refreshStats();
    });
  };

  // Register mode: commit staged rows in one batch
  const handleRegisterCommit = useCallback(
    async (
      rows: Array<{ label: string; amount: number; bucketId?: string }>,
      occurredAt: string
    ) => {
      const result = await addExpenses(rows, occurredAt);
      if (result.success) {
        refreshStats();
        setSuccessMessage(
          rows.length === 1 ? `${rows[0]!.label} added!` : `${rows.length} expenses added!`
        );
        setShowSuccessFlash(true);
      }
      return result;
    },
    [addExpenses, refreshStats]
  );

  const handleUpdateExpense = useCallback(
    async (...args: Parameters<typeof updateExpense>) => {
      const result = await updateExpense(...args);
      refreshStats();
      return result;
    },
    [updateExpense, refreshStats]
  );

  // Collect existing categories for inline edit
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats).sort();
  }, [expenses]);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setEditExpense(null);
  }, []);

  const handleTodayPress = useCallback(() => {
    setSelectedDate(new Date());
    setEditExpense(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#FDFBF7]">
      {/* Graph paper grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(#E7E7E4 1px, transparent 1px),
            linear-gradient(90deg, #E7E7E4 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Header */}
      <header className="relative flex-shrink-0 h-14 sm:h-12 px-3 sm:px-4 flex items-center justify-between border-b border-neutral-200 bg-white/80 backdrop-blur-sm safe-area-top">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-neutral-800 tracking-tight">ledgr</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard/settings"
            aria-label="Settings"
            className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-amber-50 text-xs font-medium transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline sm:ml-1">Feedback</span>
          </button>
        </div>
      </header>

      {/* Tabs + Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative flex-1 flex flex-col min-h-0 gap-0"
      >
        <div className="relative flex-shrink-0 flex justify-center py-2 border-b border-neutral-100 bg-white/60 backdrop-blur-sm">
          <TabsList className="bg-neutral-100 rounded-full">
            <TabsTrigger value="today" className="rounded-full text-xs px-4">
              Today
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-full text-xs px-4">
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        <main className="relative flex-1 overflow-auto pb-24">
          <TabsContent value="today" className="outline-none">
            <div className="max-w-lg mx-auto p-3 sm:p-4 space-y-4">
              {/* Week Strip */}
              <WeekStrip
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                expenses={expenses}
                dailyLimit={actualDailyLimit}
                timezone={timezone}
                onTodayPress={handleTodayPress}
                showIntensity={!isBudgetMode}
              />

              {/* Hero: running balance (tracking) or daily limit (budget) */}
              {isBudgetMode ? (
                <HeroDailyCard
                  remaining={selectedDayStatus.remaining}
                  limit={selectedDayStatus.limit}
                  spent={selectedDayStatus.spent}
                  expenses={heroExpenses}
                  date={selectedDate}
                  timezone={timezone}
                  isBudgetMode={isBudgetMode}
                  cardPreferences={cardPreferences}
                />
              ) : (
                <TrackingHeroCard
                  stats={stats}
                  todayDailyTotal={todayDailyTotal}
                  onStatsChanged={refreshStats}
                  onTopUp={() => setLedgerAction("income")}
                  onPlanUpcoming={() => setScheduleOpen(true)}
                />
              )}

              {/* Expense List Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {isToday ? "Today\u2019s Transactions" : "Transactions"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRegisterOpen(true)}
                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full hover:bg-teal-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
                      title="Register mode \u2014 rapid keyboard entry"
                    >
                      <TableProperties className="w-3 h-3" />
                      Register
                    </button>
                    <span className="text-xs text-neutral-400">{selectedDayExpenses.length} total</span>
                  </div>
                </div>
                <div className="divide-y divide-neutral-100">
                  {/* Ledger events: distinct line items, excluded from spend totals.
                      Append-only — corrections are made by adding an adjustment. */}
                  {selectedDayLedgerEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => showLedgerAppendOnlyToast(() => setLedgerAction("reconcile"))}
                      title="Ledger entries are a permanent record and can't be edited"
                      className="w-full text-left px-4 py-3 flex items-center gap-3 bg-neutral-50/60 hover:bg-neutral-100/70 transition-colors cursor-help focus-visible:outline-2 focus-visible:outline-teal-500"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700 truncate">
                          {event.note || LEDGER_EVENT_LABELS[event.type]}
                        </p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200/70 text-neutral-600 uppercase tracking-wide">
                          {LEDGER_EVENT_LABELS[event.type]}
                        </span>
                      </div>
                      <span
                        className={cnLedgerAmount(event.amount)}
                      >
                        {event.amount >= 0 ? "+" : "-"}
                        {formatCurrency(event.amount, CURRENCY)}
                      </span>
                    </button>
                  ))}

                  {selectedDayExpenses.length === 0 && selectedDayLedgerEvents.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-neutral-400 text-sm">
                        {isToday ? "No expenses yet today" : "No expenses recorded"}
                      </p>
                      <p className="text-neutral-300 text-xs mt-1">
                        Tap + to add your first expense
                      </p>
                    </div>
                  ) : (
                    selectedDayExpenses.map((expense) => {
                      const time = dateUtils.formatDate(expense.occurred_at, timezone, "h:mm a");
                      const bucket = expense.bucket_id
                        ? bucketById.get(expense.bucket_id)
                        : undefined;

                      return (
                        <div key={expense.id} className="group">
                          <div
                            className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                            onClick={() => setEditExpense(expense)}
                          >
                            {/* Label + metadata */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-800 truncate">
                                {expense.label}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-neutral-500">{time}</span>
                                {bucket && (
                                  <span
                                    title={
                                      bucket.include_in_daily_avg
                                        ? `${bucket.name} · counts toward daily spending`
                                        : `${bucket.name} · not counted toward daily spending`
                                    }
                                    className="text-[9px] px-1.5 py-0.5 rounded-full border border-neutral-200 text-neutral-600 font-medium inline-flex items-center gap-1"
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: bucket.include_in_daily_avg
                                          ? (bucket.color ?? "#6b7280")
                                          : "transparent",
                                        boxShadow: bucket.include_in_daily_avg
                                          ? undefined
                                          : `inset 0 0 0 1px ${bucket.color ?? "#6b7280"}`,
                                      }}
                                    />
                                    {bucket.name}
                                  </span>
                                )}
                                {expense.category && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                                    {expense.category}
                                  </span>
                                )}
                              </div>
                              {expense.notes && (
                                <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                  {expense.notes}
                                </p>
                              )}
                            </div>

                            {/* Amount */}
                            <span className="text-sm font-semibold text-neutral-700 tabular-nums flex-shrink-0">
                              -{formatCurrency(expense.amount, CURRENCY)}
                            </span>

                            {/* Delete */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense.id); }}
                              className="p-1.5 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                              aria-label="Delete expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="outline-none">
            <Suspense
              fallback={
                <div className="max-w-lg mx-auto p-4 space-y-4">
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                    <div className="h-5 w-32 bg-neutral-200/60 animate-pulse rounded-md" />
                    <div className="h-40 w-full bg-neutral-200/60 animate-pulse rounded-xl" />
                  </div>
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                    <div className="h-5 w-40 bg-neutral-200/60 animate-pulse rounded-md" />
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="h-4 w-24 bg-neutral-200/60 animate-pulse rounded-md" />
                          <div className="h-4 w-16 bg-neutral-200/60 animate-pulse rounded-md" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              }
            >
              <InsightsTab
                expenses={expenses}
                dailyLimit={actualDailyLimit}
                isBudgetMode={isBudgetMode}
                ledgerEvents={initialLedgerEvents}
                buckets={buckets}
                currentBalance={stats?.balance ?? null}
                forecastPoints={stats?.forecastPoints ?? []}
              />
            </Suspense>
          </TabsContent>
        </main>
      </Tabs>

      {/* Smart Input Bar */}
      <SmartInputBar
        onAddExpenses={handleAiAddExpenses}
        preview={preview}
        isParsing={isParsing}
        onInputChange={updatePreview}
        onSubmit={submit}
        onSubmitPreview={submitPreview}
        onPreviewUpdate={updatePreviewItem}
        onPreviewRemove={removePreviewItem}
        buckets={buckets}
        defaultBucketSlug={defaultBucket?.slug}
        openTrigger={smartInputTrigger}
        onTopUp={isBudgetMode ? undefined : handleTopUp}
      />

      {/* Success Animation */}
      <SuccessFlash
        show={showSuccessFlash}
        message={successMessage}
        position="top"
        size="medium"
        onComplete={() => setShowSuccessFlash(false)}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAddExpenses={() => setSmartInputTrigger((n) => n + 1)}
        onRegisterMode={() => setRegisterOpen(true)}
        onLedgerAction={setLedgerAction}
        onPlanUpcoming={() => setScheduleOpen(true)}
        onNavigateTab={setActiveTab}
        showLedgerActions={!isBudgetMode}
      />

      {/* Ledger mini-flows (income / savings / reconcile) */}
      <LedgerActionDialog
        mode={ledgerAction}
        onClose={() => setLedgerAction(null)}
        onSuccess={(message) => {
          refreshStats();
          setSuccessMessage(message);
          setShowSuccessFlash(true);
        }}
      />

      {/* Plan upcoming (scheduled events → runway forecast) */}
      <ScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onChanged={refreshStats}
        timezone={timezone}
      />

      {/* Register Mode */}
      <RegisterMode
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        buckets={buckets}
        defaultBucketId={defaultBucket?.id}
        timezone={timezone}
        onCommit={handleRegisterCommit}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* Expense Edit Modal */}
      <ExpenseEditModal
        expense={editExpense}
        open={editExpense !== null}
        onClose={() => setEditExpense(null)}
        onSave={handleUpdateExpense}
        onDelete={handleDeleteExpense}
        buckets={buckets}
        existingCategories={existingCategories}
        timezone={timezone}
      />
    </div>
  );
}

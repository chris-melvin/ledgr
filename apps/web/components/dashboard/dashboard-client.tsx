"use client";

import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Settings, MessageSquarePlus, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isSameDay } from "date-fns";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { WeekStrip } from "@/components/calendar/week-strip";
import { SmartInputBar } from "@/components/expenses/smart-input-bar";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { SuccessFlash } from "@/components/ui/success-flash";

import { useServerExpenses } from "@/hooks/use-server-expenses";
import { useAiParser } from "@/hooks/use-ai-parser";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useSubscription, useFeatureAccess } from "@/hooks/use-subscription";
import { usePaddle } from "@/components/paddle/paddle-provider";
import { HeroDailyCard } from "@/components/dashboard/hero-daily-card";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import { UpgradePrompt, ProSuccessModal } from "@/components/subscription";
import { showExpenseDeletedToast } from "@/components/ui/undo-toast";
import { restoreExpense } from "@/actions/expenses/restore";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT, CURRENCY } from "@/lib/constants";
import type { Expense, TrackingMode } from "@repo/database";
import type { ParsedExpense } from "@/hooks/use-ai-parser";

const InsightsTab = lazy(() =>
  import("@/components/insights/insights-tab").then((m) => ({
    default: m.InsightsTab,
  }))
);

interface DashboardClientProps {
  initialExpenses: Expense[];
  dailyLimit?: number;
  trackingMode?: TrackingMode;
}

export function DashboardClient({ initialExpenses, dailyLimit, trackingMode = "tracking_only" }: DashboardClientProps) {
  const { timezone } = useTimezone();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Added!");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [proModalOpen, setProModalOpen] = useState(false);

  const actualDailyLimit = dailyLimit ?? DEFAULT_DAILY_LIMIT;
  const isBudgetMode = trackingMode === "budget_enabled";

  const { refreshStatus, subscription } = useSubscription();
  const analyticsAccess = useFeatureAccess("analytics");
  const { onCheckoutComplete } = usePaddle();

  // Handle ?upgraded=true query param
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      refreshStatus();
      setProModalOpen(true);
      router.replace("/dashboard");
    }
  }, [searchParams, refreshStatus, router]);

  // Register Paddle checkout.completed callback
  useEffect(() => {
    onCheckoutComplete.current = () => {
      setTimeout(() => {
        refreshStatus();
        setProModalOpen(true);
      }, 2000);
    };
    return () => {
      onCheckoutComplete.current = null;
    };
  }, [onCheckoutComplete, refreshStatus]);

  // Server-backed expenses with optimistic updates
  const { expenses, addExpenses, updateExpense, removeExpense } =
    useServerExpenses(initialExpenses);

  const { shortcuts } = useShortcuts();

  const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);

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

      const firstExpense = parsedExpenses[0];
      setSuccessMessage(
        parsedExpenses.length === 1 && firstExpense
          ? `${firstExpense.label} added!`
          : `${parsedExpenses.length} expenses added!`
      );
      setShowSuccessFlash(true);
    },
    [addExpenses, timezone, selectedDate]
  );

  const { preview, isParsing, updatePreview, updatePreviewItem, submit } = useAiParser({
    onSuccess: handleAiAddExpenses,
    shortcuts,
  });

  const handleDeleteExpense = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    const expenseLabel = expense?.label || "Expense";
    await removeExpense(id);
    showExpenseDeletedToast(expenseLabel, async () => {
      await restoreExpense(id);
    });
  };

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
          {subscription.isPro && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white leading-none">
              pro
            </span>
          )}
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
      <Tabs defaultValue="today" className="relative flex-1 flex flex-col min-h-0 gap-0">
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
              />

              {/* Hero Daily Card */}
              <HeroDailyCard
                remaining={selectedDayStatus.remaining}
                limit={selectedDayStatus.limit}
                spent={selectedDayStatus.spent}
                expenses={heroExpenses}
                date={selectedDate}
                timezone={timezone}
                isBudgetMode={isBudgetMode}
              />

              {/* Expense List Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {isToday ? "Today\u2019s Transactions" : "Transactions"}
                  </h3>
                  <span className="text-xs text-neutral-400">{selectedDayExpenses.length} total</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {selectedDayExpenses.length === 0 ? (
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
            {analyticsAccess.hasAccess ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-neutral-200 border-t-teal-500 rounded-full animate-spin" />
                  </div>
                }
              >
                <InsightsTab
                  expenses={expenses}
                  dailyLimit={actualDailyLimit}
                  isBudgetMode={isBudgetMode}
                />
              </Suspense>
            ) : (
              <div className="max-w-lg mx-auto p-4">
                <UpgradePrompt accessResult={analyticsAccess} variant="card" />
              </div>
            )}
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
        onPreviewUpdate={updatePreviewItem}
      />

      {/* Success Animation */}
      <SuccessFlash
        show={showSuccessFlash}
        message={successMessage}
        position="top"
        size="medium"
        onComplete={() => setShowSuccessFlash(false)}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* Expense Edit Modal */}
      <ExpenseEditModal
        expense={editExpense}
        open={editExpense !== null}
        onClose={() => setEditExpense(null)}
        onSave={updateExpense}
        onDelete={handleDeleteExpense}
        existingCategories={existingCategories}
        timezone={timezone}
      />

      {/* Pro Success Modal */}
      <ProSuccessModal
        open={proModalOpen}
        onClose={() => setProModalOpen(false)}
      />
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Settings, MessageSquarePlus, Trash2, ChevronDown } from "lucide-react";
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
import { HeroDailyCard } from "@/components/dashboard/hero-daily-card";
import { showExpenseDeletedToast } from "@/components/ui/undo-toast";
import { restoreExpense } from "@/actions/expenses/restore";
import { formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT, CURRENCY } from "@/lib/constants";
import type { Expense, TrackingMode } from "@repo/database";

interface DashboardClientProps {
  initialExpenses: Expense[];
  dailyLimit?: number;
  trackingMode?: TrackingMode;
}

export function DashboardClient({ initialExpenses, dailyLimit, trackingMode = "tracking_only" }: DashboardClientProps) {
  const { timezone } = useTimezone();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Added!");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const actualDailyLimit = dailyLimit ?? DEFAULT_DAILY_LIMIT;
  const isBudgetMode = trackingMode === "budget_enabled";

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
      parsedExpenses: Array<{ amount: number; label: string; category?: string; bucketId?: string }>
    ) => {
      // Today: use current time. Other days: use midnight of that day.
      const timestamp = isToday
        ? dateUtils.getCurrentTimestamp(timezone)
        : dateUtils.toTimestamp(selectedDate, timezone);
      const result = await addExpenses(parsedExpenses, timestamp);
      if (!result.success) return; // error toast already shown by hook

      const firstExpense = parsedExpenses[0];
      setSuccessMessage(
        parsedExpenses.length === 1 && firstExpense
          ? `${firstExpense.label} added!`
          : `${parsedExpenses.length} expenses added!`
      );
      setShowSuccessFlash(true);
    },
    [addExpenses, timezone, isToday, selectedDate]
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
    setEditingExpenseId(null);
  }, []);

  const handleTodayPress = useCallback(() => {
    setSelectedDate(new Date());
    setEditingExpenseId(null);
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
        <span className="text-base font-bold text-neutral-800 tracking-tight">margin</span>

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

      {/* Scrollable Main Content */}
      <main className="relative flex-1 overflow-auto pb-24">
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
                  const isEditing = editingExpenseId === expense.id;
                  const time = dateUtils.formatDate(expense.occurred_at, timezone, "h:mm a");

                  return (
                    <div key={expense.id} className="group">
                      <div className="px-4 py-3 flex items-center gap-3">
                        {/* Label + metadata */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">
                            {expense.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-neutral-500">{time}</span>
                            {expense.category && (
                              <button
                                onClick={() => setEditingExpenseId(isEditing ? null : expense.id)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                              >
                                {expense.category}
                              </button>
                            )}
                            {!expense.category && (
                              <button
                                onClick={() => setEditingExpenseId(isEditing ? null : expense.id)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-50 text-neutral-400 hover:bg-neutral-100 transition-colors"
                              >
                                + category
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <span className="text-sm font-semibold text-neutral-700 tabular-nums flex-shrink-0">
                          -{formatCurrency(expense.amount, CURRENCY)}
                        </span>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1.5 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Inline category editor */}
                      {isEditing && (
                        <div className="px-4 pb-3 pt-0 border-t border-neutral-100">
                          <div className="pt-2">
                            <label className="text-[10px] font-medium text-neutral-700 uppercase tracking-wider block mb-1">
                              Category
                            </label>
                            <div className="relative">
                              <select
                                value={expense.category || ""}
                                onChange={(e) => {
                                  updateExpense(expense.id, { category: e.target.value || null });
                                  setEditingExpenseId(null);
                                }}
                                className="w-full text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              >
                                <option value="">No category</option>
                                {existingCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

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
    </div>
  );
}

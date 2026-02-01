"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  PieChart,
  List,
  Plus,
  Wallet,
  Settings,
  ChevronRight,
  X,
  Receipt,
  MessageSquarePlus,
} from "lucide-react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DayDetailPanel } from "@/components/day-detail/day-detail-panel";
import { DayDetailSheet } from "@/components/day-detail/day-detail-sheet";
import { SmartInputBar } from "@/components/expenses/smart-input-bar";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { CreateShortcutModal } from "@/components/shortcuts/create-shortcut-modal";
import { SuccessFlash } from "@/components/ui/success-flash";
import { useServerExpenses } from "@/hooks/use-server-expenses";
import { useCalendar } from "@/hooks/use-calendar";
import { useAiParser, UnknownShortcut } from "@/hooks/use-ai-parser";
import { useWeeklyPatterns } from "@/hooks/use-weekly-patterns";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useMicroInteractions } from "@/hooks/use-micro-interactions";
import { useOnboarding } from "@/components/onboarding";
import { useBudgetProgress } from "@/hooks/use-budget-progress";
import { WeeklyPatternCard } from "@/components/dashboard/weekly-pattern-card";
import { IncomeAllocationCard } from "@/components/dashboard/income-allocation-card";
import { SavingsCelebration } from "@/components/dashboard/savings-celebration";
import { UpcomingBillsWidget } from "@/components/dashboard/upcoming-bills-widget";
import { WeeklyProgressCard } from "@/components/dashboard/weekly-progress-card";
import { RolloverDisplay } from "@/components/dashboard/rollover-display";
import { showExpenseDeletedToast } from "@/components/ui/undo-toast";
import { restoreExpense } from "@/actions/expenses/restore";
import { formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT, CURRENCY } from "@/lib/constants";
import type { Expense, BudgetBucket, Income, Debt } from "@repo/database";
import type { LocalIncome, LocalBill } from "@/lib/types";
import { useBuckets } from "@/hooks/use-buckets";
import { useQuickTemplates, type QuickTemplate } from "@/hooks/use-quick-templates";
import { QuickTemplateEditor } from "@/components/dashboard/quick-template-editor";

// Helper to transform database Income to LocalIncome
function toLocalIncome(income: Income): LocalIncome {
  return {
    id: income.id,
    label: income.label,
    amount: income.amount,
    dayOfMonth: income.day_of_month ?? 1,
    expectedDate: income.expected_timestamp ?? undefined,
    receivedDate: income.received_timestamp ?? undefined,
    isRecurring: income.frequency !== "once",
    recurringPattern: income.frequency !== "once" ? {
      frequency: income.frequency as "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly",
      endDate: income.end_timestamp ?? undefined,
    } : undefined,
    status: income.status as "pending" | "received" | "expected",
  };
}

// Helper to transform database Debt to LocalBill
function toLocalBill(bill: Debt, timezone: string): LocalBill {
  const today = new Date();
  const dueDay = bill.due_date ?? 1;
  const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

  return {
    id: bill.id,
    label: bill.label,
    amount: bill.amount,
    icon: bill.icon ?? undefined,
    receiveDate: bill.receive_timestamp ?? undefined,
    dueDate: dateUtils.formatInTimezone(dueDate, timezone, "yyyy-MM-dd"),
    paidDate: bill.paid_timestamp ?? undefined,
    dueDayOfMonth: bill.due_date ?? undefined,
    isRecurring: bill.is_recurring,
    recurringPattern: bill.is_recurring ? {
      frequency: bill.frequency as "weekly" | "biweekly" | "monthly" | "yearly",
      dayOfMonth: bill.due_date ?? undefined,
      endDate: bill.end_timestamp ?? undefined,
    } : undefined,
    status: bill.status as "pending" | "paid" | "overdue" | "partially_paid",
  };
}

type TabType = "calendar" | "insights" | "transactions";

interface DashboardClientProps {
  initialExpenses: Expense[];
  dailyLimit?: number;
  initialBuckets?: BudgetBucket[];
  initialIncomes?: Income[];
  initialBills?: Debt[];
  trackingMode?: "tracking_only" | "budget_enabled";
}

/**
 * Main dashboard client component with timezone support
 *
 * Updated to use Expense type with occurred_at timestamps
 */
export function DashboardClient({
  initialExpenses,
  dailyLimit,
  initialBuckets = [],
  initialIncomes = [],
  initialBills = [],
  trackingMode = "tracking_only"
}: DashboardClientProps) {
  const { timezone } = useTimezone();
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobileDaySheetOpen, setIsMobileDaySheetOpen] = useState(false);
  const [pendingShortcutData, setPendingShortcutData] = useState<UnknownShortcut | null>(null);

  // Transform database types to local types
  const incomes = useMemo(() =>
    initialIncomes.map(toLocalIncome),
    [initialIncomes]
  );

  const bills = useMemo(() =>
    initialBills.map((bill) => toLocalBill(bill, timezone)),
    [initialBills, timezone]
  );
  const [hideSavings, setHideSavings] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Added!");
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Quick templates state
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [templateEditorMode, setTemplateEditorMode] = useState<"add" | "edit" | "manage">("add");

  // Allocation values calculated from real data
  const totalIncome = useMemo(() => incomes.reduce((sum, inc) => sum + inc.amount, 0), [incomes]);
  const totalBills = useMemo(() => bills.reduce((sum, bill) => sum + bill.amount, 0), [bills]);
  const actualDailyLimit = dailyLimit ?? DEFAULT_DAILY_LIMIT;
  const dailyBudgetAllocation = actualDailyLimit * 30;

  // Server-backed expenses with optimistic updates
  const { expenses, addExpense, addExpenses, updateExpense, removeExpense, isPending } = useServerExpenses(initialExpenses);

  // Onboarding
  const { restartTour, onExpenseAdded } = useOnboarding();

  // Micro-interactions for Duolingo-style feedback
  const { quickWin, playSound } = useMicroInteractions();

  // Note: Expenses now use occurred_at timestamps
  // Pass expenses directly to hooks that support Expense type
  const localExpenses = expenses;

  const { todayStatus } = useCalendar(localExpenses, { dailyLimit });
  const weeklyPatterns = useWeeklyPatterns(localExpenses);
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();
  const { buckets, defaultBucket, findBySlug } = useBuckets({ initialBuckets });

  // Quick templates from localStorage
  const {
    templates: quickTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    resetToDefaults: resetTemplatesToDefaults,
  } = useQuickTemplates();

  // Calculate flex bucket and savings from actual bucket data
  const flexBucket = findBySlug("flex")?.allocated_amount ?? 0;
  const savingsAllocation = findBySlug("savings")?.allocated_amount ?? 0;

  // Budget progress calculations (weekly, monthly, rollover)
  const budgetProgress = useBudgetProgress(localExpenses, {
    dailyLimit: actualDailyLimit,
    weekStartsOn: 1, // Monday
  });

  // Debug: log buckets
  if (process.env.NODE_ENV === "development") {
    console.log("[DashboardClient] initialBuckets:", initialBuckets);
    console.log("[DashboardClient] buckets:", buckets);
    console.log("[DashboardClient] defaultBucket:", defaultBucket);
  }

  // Collect unique categories from existing expenses for suggestions
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats).sort();
  }, [expenses]);

  // AI Parser - Updated to use batch add with success animation
  const handleAiAddExpenses = useCallback(
    async (parsedExpenses: Array<{ amount: number; label: string; category?: string; bucketId?: string }>) => {
      const timestamp = dateUtils.getCurrentTimestamp(timezone);
      await addExpenses(parsedExpenses, timestamp);

      // Trigger success feedback
      quickWin();

      // Show success flash
      const firstExpense = parsedExpenses[0];
      setSuccessMessage(
        parsedExpenses.length === 1 && firstExpense
          ? `${firstExpense.label} added!`
          : `${parsedExpenses.length} expenses added!`
      );
      setShowSuccessFlash(true);

      // Notify onboarding
      onExpenseAdded?.();
    },
    [addExpenses, quickWin, onExpenseAdded, timezone]
  );

  const handleUnknownShortcut = useCallback((unknown: UnknownShortcut) => {
    setPendingShortcutData(unknown);
    setIsShortcutModalOpen(true);
  }, []);

  const { preview, isParsing, updatePreview, updatePreviewItem, submit, clearPendingShortcut } = useAiParser({
    onSuccess: handleAiAddExpenses,
    onUnknownShortcut: handleUnknownShortcut,
    shortcuts,
    buckets,
    defaultBucketId: defaultBucket?.id,
  });

  // Today's expenses using timezone-aware filtering
  const todayExpenses = useMemo(() => {
    const todayKey = dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");
    return localExpenses
      .filter((e) => {
        const expenseKey = dateUtils.formatInTimezone(new Date(e.occurred_at), timezone, "yyyy-MM-dd");
        return expenseKey === todayKey;
      })
      .map((e) => ({ label: e.label, amount: e.amount }));
  }, [localExpenses, timezone]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDaySheetOpen(true);
    }
  };

  const handleAddExpense = async (amount: number, label: string) => {
    if (selectedDate) {
      const timestamp = dateUtils.toTimestamp(selectedDate, timezone);
      await addExpense(timestamp, amount, label, {
        bucketId: defaultBucket?.id,
      });
      quickWin();
      setSuccessMessage(`${label} added!`);
      setShowSuccessFlash(true);
    }
  };

  // Handler for day detail smart input - adds expenses to selected date
  const handleDayDetailSmartSubmit = useCallback(async (input: string) => {
    if (!selectedDate || !input.trim()) return;

    // Get the current preview (already parsed locally)
    if (preview.length > 0) {
      const timestamp = dateUtils.toTimestamp(selectedDate, timezone);
      // Add each expense to the selected date
      for (const exp of preview) {
        await addExpense(timestamp, exp.amount, exp.label, {
          category: exp.category,
          bucketId: exp.bucketId ?? defaultBucket?.id,
        });
      }

      // Trigger success feedback
      quickWin();
      setSuccessMessage(
        preview.length === 1
          ? `${preview[0]?.label || 'Expense'} added!`
          : `${preview.length} expenses added!`
      );
      setShowSuccessFlash(true);

      // Clear the preview
      updatePreview("");
    }
  }, [selectedDate, preview, addExpense, quickWin, updatePreview, defaultBucket, timezone]);

  const handleQuickAdd = async (amount: number, label: string) => {
    const timestamp = dateUtils.getCurrentTimestamp(timezone);
    await addExpense(timestamp, amount, label, {
      bucketId: defaultBucket?.id,
    });
    quickWin();
    setSuccessMessage(`${label} added!`);
    setShowSuccessFlash(true);
  };

  const handleDeleteExpense = async (id: string) => {
    // Find the expense to get its label for the toast
    const expense = expenses.find(e => e.id === id);
    const expenseLabel = expense?.label || "Expense";

    await removeExpense(id);

    // Show undo toast
    showExpenseDeletedToast(expenseLabel, async () => {
      await restoreExpense(id);
      // The page will revalidate and show the restored expense
    });
  };

  const handleOpenCreateShortcut = () => {
    setPendingShortcutData({ trigger: "", amount: 0 });
    setIsShortcutModalOpen(true);
  };

  const handleSaveShortcut = (trigger: string, label: string, icon?: string) => {
    addShortcut(trigger, label, icon);
    clearPendingShortcut();
  };

  const handleSaveAndLogShortcut = async (trigger: string, label: string, amount: number, icon?: string) => {
    addShortcut(trigger, label, icon);
    const timestamp = dateUtils.getCurrentTimestamp(timezone);
    await addExpense(timestamp, amount, label);
    clearPendingShortcut();
  };

  const handleCloseShortcutModal = () => {
    setIsShortcutModalOpen(false);
    setPendingShortcutData(null);
    clearPendingShortcut();
  };

  // Template editor handlers
  const handleOpenAddTemplate = () => {
    setSelectedTemplate(null);
    setTemplateEditorMode("add");
    setTemplateEditorOpen(true);
  };

  const handleEditTemplate = (template: QuickTemplate) => {
    setSelectedTemplate(template);
    setTemplateEditorMode("edit");
    setTemplateEditorOpen(true);
  };

  const handleManageTemplates = () => {
    setSelectedTemplate(null);
    setTemplateEditorMode("manage");
    setTemplateEditorOpen(true);
  };

  // Calculate budget status
  const budgetPercent = Math.min((todayStatus.spent / todayStatus.limit) * 100, 100);
  const isOverBudget = todayStatus.remaining < 0;
  const statusColor = isOverBudget
    ? "text-rose-600"
    : budgetPercent >= 80
    ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div className="h-screen bg-[#fafaf9] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 sm:h-12 px-3 sm:px-4 flex items-center justify-between border-b border-neutral-200/60 bg-white/80 backdrop-blur-sm safe-area-top">
        {/* Today's Status */}
        <button
          data-onboarding-target="header-status"
          onClick={() => setIsQuickActionsOpen(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
            "bg-gradient-to-r",
            trackingMode === "tracking_only"
              ? "from-teal-50 to-teal-100/50 border border-teal-200"
              : isOverBudget
              ? "from-rose-50 to-rose-100/50 border border-rose-200"
              : budgetPercent >= 80
              ? "from-amber-50 to-amber-100/50 border border-amber-200"
              : "from-emerald-50 to-emerald-100/50 border border-emerald-200",
            "active:scale-95 sm:hover:shadow-md"
          )}
        >
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              isPending ? "animate-pulse" : "",
              trackingMode === "tracking_only"
                ? "bg-teal-500"
                : isOverBudget
                ? "bg-rose-500"
                : budgetPercent >= 80
                ? "bg-amber-500"
                : "bg-emerald-500"
            )}
          />
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              trackingMode === "tracking_only" ? "text-teal-700" : statusColor
            )}
          >
            {trackingMode === "tracking_only"
              ? formatCurrency(todayStatus.spent, CURRENCY)
              : formatCurrency(Math.abs(todayStatus.remaining), CURRENCY)}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase hidden min-[400px]:inline">
            {trackingMode === "tracking_only" ? "spent" : isOverBudget ? "over" : "left"}
          </span>
        </button>

        {/* Tab Navigation */}
        <div className="flex items-center bg-neutral-100/80 rounded-xl p-1">
          {[
            { id: "calendar" as TabType, icon: Calendar, label: "Calendar" },
            { id: "insights" as TabType, icon: PieChart, label: "Insights" },
            { id: "transactions" as TabType, icon: List, label: "List" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 p-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <tab.icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard/budget"
            className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-amber-50 text-xs font-medium transition-colors"
          >
            <Receipt className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline sm:ml-1">Budget</span>
          </Link>
          {/* Analytics link hidden for MVP - to be polished later */}
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-neutral-200/60 bg-white/50 flex-col overflow-y-auto">
          {/* Today's Status - Circular Progress */}
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center gap-4">
              {trackingMode === "budget_enabled" ? (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e5e4" strokeWidth="6" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke={isOverBudget ? "#ef4444" : budgetPercent >= 80 ? "#f59e0b" : "#10b981"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${budgetPercent * 2.136} 213.6`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-lg font-bold tabular-nums", statusColor)}>
                      {formatCurrency(Math.abs(todayStatus.remaining), CURRENCY)}
                    </span>
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider">
                      {isOverBudget ? "Over" : "Left"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e0f2fe" strokeWidth="6" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold tabular-nums text-teal-700">
                      {formatCurrency(todayStatus.spent, CURRENCY)}
                    </span>
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider">
                      Spent
                    </span>
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p className="text-sm font-semibold text-neutral-800 truncate">
                  {trackingMode === "tracking_only"
                    ? "Tracking Mode"
                    : isOverBudget
                    ? "Over Budget"
                    : budgetPercent >= 80
                    ? "Almost There"
                    : "On Track"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {trackingMode === "tracking_only"
                    ? `${todayExpenses.length} expense${todayExpenses.length !== 1 ? "s" : ""} today`
                    : `Spent ${formatCurrency(todayStatus.spent, CURRENCY)} of ${formatCurrency(
                        todayStatus.limit,
                        CURRENCY
                      )}`}
                </p>
              </div>
            </div>
            {todayExpenses.length > 0 && (
              <div className="mt-3 space-y-1">
                {todayExpenses.slice(0, 3).map((exp, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 truncate">{exp.label}</span>
                    <span className="text-neutral-700 font-medium tabular-nums">
                      -{formatCurrency(exp.amount, CURRENCY)}
                    </span>
                  </div>
                ))}
                {todayExpenses.length > 3 && (
                  <p className="text-[10px] text-neutral-400">+{todayExpenses.length - 3} more</p>
                )}
              </div>
            )}

            {/* Savings celebration message */}
            <div className="mt-3">
              <SavingsCelebration
                amount={todayStatus.remaining}
                currency={CURRENCY}
              />
            </div>

            {/* Rollover from previous days */}
            {budgetProgress.rolloverAmount > 0 && (
              <div className="mt-3">
                <RolloverDisplay
                  amount={budgetProgress.rolloverAmount}
                  currency={CURRENCY}
                />
              </div>
            )}
          </div>

          {/* Weekly Progress */}
          <WeeklyProgressCard
            spent={budgetProgress.weeklyProgress.totalSpent}
            budget={budgetProgress.weeklyProgress.totalBudget}
            percentUsed={budgetProgress.weeklyProgress.percentUsed}
            daysTracked={budgetProgress.weeklyProgress.daysTracked}
            currency={CURRENCY}
          />

          {/* Upcoming Bills */}
          <UpcomingBillsWidget
            bills={initialBills}
            currency={CURRENCY}
            maxItems={4}
          />

          {/* Quick Add Grid */}
          <div data-onboarding-target="quick-add-grid" className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">
                Quick Add
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleManageTemplates}
                  className="p-1 rounded text-neutral-400 hover:text-teal-600 hover:bg-teal-50 transition-colors text-[9px]"
                  title="Manage templates"
                >
                  Edit
                </button>
                <button
                  onClick={handleOpenAddTemplate}
                  className="p-1 rounded text-neutral-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Add template"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quickTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleQuickAdd(template.amount, template.label)}
                  onDoubleClick={() => handleEditTemplate(template)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-50 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all group"
                  title={`${template.label}: ${formatCurrency(template.amount, CURRENCY)} (double-click to edit)`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {template.icon}
                  </span>
                  <span className="text-[9px] text-neutral-500 group-hover:text-teal-700 truncate w-full text-center">
                    {template.label}
                  </span>
                </button>
              ))}
            </div>
            {shortcuts.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
                  Your Shortcuts
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {shortcuts.slice(0, 4).map((shortcut) => (
                    <button
                      key={shortcut.id}
                      onClick={() => handleQuickAdd(100, shortcut.label)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50/50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 transition-all group"
                    >
                      <span className="text-lg">{shortcut.icon || "📌"}</span>
                      <span className="text-[9px] text-amber-700 truncate w-full text-center">
                        @{shortcut.trigger}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "calendar" && (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 lg:flex-initial lg:w-[68%] xl:w-[65%] p-2 sm:p-4 overflow-auto">
                <CalendarGrid
                  expenses={localExpenses}
                  incomes={incomes}
                  bills={bills}
                  buckets={buckets}
                  onDayClick={handleDayClick}
                  selectedDate={selectedDate}
                />
              </div>

              <div className="hidden lg:flex lg:w-[32%] xl:w-[35%] border-l border-neutral-200/60 bg-white/50 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <DayDetailPanel
                    selectedDate={selectedDate}
                    expenses={localExpenses}
                    bills={bills}
                    incomes={incomes}
                    dailyLimit={DEFAULT_DAILY_LIMIT}
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onUpdateExpense={updateExpense}
                    preview={preview}
                    isParsing={isParsing}
                    onInputChange={updatePreview}
                    onSubmit={handleDayDetailSmartSubmit}
                    buckets={buckets}
                    categories={existingCategories}
                    onPreviewUpdate={updatePreviewItem}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="flex-1 p-3 sm:p-4 overflow-auto">
              <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
                <WeeklyPatternCard
                  weeklyTotal={weeklyPatterns.weeklyTotal}
                  previousWeekTotal={weeklyPatterns.previousWeekTotal}
                  categoryBreakdown={weeklyPatterns.categoryBreakdown}
                  highestDay={weeklyPatterns.highestDay}
                  suggestion={weeklyPatterns.suggestion}
                />
                <IncomeAllocationCard
                  totalIncome={totalIncome}
                  dailyBudgetAllocation={dailyBudgetAllocation}
                  billsAllocation={totalBills}
                  flexBucketAllocation={flexBucket}
                  savingsAllocation={savingsAllocation}
                  hideSavings={hideSavings}
                  onToggleSavings={setHideSavings}
                />
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="flex-1 p-3 sm:p-4 overflow-auto">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-800">Recent Transactions</h3>
                    <span className="text-xs text-neutral-400">{expenses.length} total</span>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {expenses.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-neutral-400 text-sm">No transactions yet</p>
                        <p className="text-neutral-300 text-xs mt-1">Add your first expense above</p>
                      </div>
                    ) : (
                      expenses
                        .slice()
                        .reverse()
                        .slice(0, 50)
                        .map((expense) => (
                          <div
                            key={expense.id}
                            className={cn(
                              "px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors active:bg-neutral-100",
                              expense.id.startsWith("temp-") && "opacity-60"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-neutral-800">{expense.label}</p>
                              <p className="text-xs text-neutral-400">
                                {dateUtils.formatDate(expense.occurred_at, timezone, dateUtils.DATE_FORMATS.WEEKDAY_SHORT)}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-neutral-700 tabular-nums">
                              -{formatCurrency(expense.amount, CURRENCY)}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Quick Actions Bottom Sheet */}
      {isQuickActionsOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsQuickActionsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-neutral-300" />
            </div>

            <div className="px-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-4">
                {trackingMode === "budget_enabled" ? (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e5e4" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke={isOverBudget ? "#ef4444" : budgetPercent >= 80 ? "#f59e0b" : "#10b981"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${budgetPercent * 2.136} 213.6`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-base font-bold tabular-nums", statusColor)}>
                        {Math.round(budgetPercent)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e0f2fe" strokeWidth="8" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold tabular-nums text-teal-700">
                        {formatCurrency(todayStatus.spent, CURRENCY)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  {trackingMode === "tracking_only" ? (
                    <>
                      <p className="text-xl font-bold tabular-nums text-teal-700">
                        {formatCurrency(todayStatus.spent, CURRENCY)}{" "}
                        <span className="text-sm font-normal text-neutral-400">spent</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {todayExpenses.length} expense{todayExpenses.length !== 1 ? "s" : ""} today
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={cn("text-xl font-bold tabular-nums", statusColor)}>
                        {formatCurrency(Math.abs(todayStatus.remaining), CURRENCY)}{" "}
                        <span className="text-sm font-normal text-neutral-400">
                          {isOverBudget ? "over" : "left"}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Spent {formatCurrency(todayStatus.spent, CURRENCY)} of{" "}
                        {formatCurrency(todayStatus.limit, CURRENCY)}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="p-2 rounded-full bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {todayExpenses.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {todayExpenses.map((exp, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full bg-neutral-100 text-xs"
                    >
                      <span className="text-neutral-600">{exp.label}</span>
                      <span className="text-neutral-400 ml-1">
                        {formatCurrency(exp.amount, CURRENCY)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Quick Add
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsQuickActionsOpen(false);
                      handleManageTemplates();
                    }}
                    className="px-2 py-1 rounded-lg text-neutral-400 hover:text-teal-600 hover:bg-teal-50 transition-colors text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setIsQuickActionsOpen(false);
                      handleOpenAddTemplate();
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {quickTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      handleQuickAdd(template.amount, template.label);
                      setIsQuickActionsOpen(false);
                    }}
                    onDoubleClick={() => {
                      setIsQuickActionsOpen(false);
                      handleEditTemplate(template);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-neutral-50 active:bg-teal-100 active:scale-95 border border-neutral-100 transition-all"
                  >
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-[10px] text-neutral-600 truncate w-full text-center">
                      {template.label}
                    </span>
                  </button>
                ))}
              </div>
              {shortcuts.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-3">
                    Your Shortcuts
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {shortcuts.slice(0, 4).map((shortcut) => (
                      <button
                        key={shortcut.id}
                        onClick={() => {
                          handleQuickAdd(100, shortcut.label);
                          setIsQuickActionsOpen(false);
                        }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-amber-50 active:bg-amber-200 active:scale-95 border border-amber-100 transition-all"
                      >
                        <span className="text-2xl">{shortcut.icon || "📌"}</span>
                        <span className="text-[10px] text-amber-700 truncate w-full text-center">
                          @{shortcut.trigger}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Day Detail Sheet */}
      <DayDetailSheet
        isOpen={isMobileDaySheetOpen}
        onClose={() => setIsMobileDaySheetOpen(false)}
        selectedDate={selectedDate}
        expenses={localExpenses}
        bills={bills}
        incomes={incomes}
        dailyLimit={DEFAULT_DAILY_LIMIT}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        onUpdateExpense={updateExpense}
        preview={preview}
        isParsing={isParsing}
        onInputChange={updatePreview}
        onSubmit={handleDayDetailSmartSubmit}
        buckets={buckets}
        categories={existingCategories}
        onPreviewUpdate={updatePreviewItem}
      />

      {/* Create Shortcut Modal */}
      <CreateShortcutModal
        isOpen={isShortcutModalOpen}
        onClose={handleCloseShortcutModal}
        trigger={pendingShortcutData?.trigger || ""}
        amount={pendingShortcutData?.amount || 0}
        onSave={handleSaveShortcut}
        onSaveAndLog={handleSaveAndLogShortcut}
      />

      {/* Quick Template Editor Modal */}
      <QuickTemplateEditor
        open={templateEditorOpen}
        onOpenChange={setTemplateEditorOpen}
        template={selectedTemplate}
        onSave={addTemplate}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
        onResetToDefaults={resetTemplatesToDefaults}
        mode={templateEditorMode}
      />

      {/* Smart Input Bar */}
      <SmartInputBar
        onAddExpenses={handleAiAddExpenses}
        preview={preview}
        isParsing={isParsing}
        onInputChange={updatePreview}
        onSubmit={submit}
        buckets={buckets}
        categories={existingCategories}
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

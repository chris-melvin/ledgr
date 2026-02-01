"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Calendar, MoreHorizontal, Pencil, Trash2, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BentoCard, BentoCardEmpty } from "./bento-card";
import { BillForm } from "./bill-form";
import { formatCurrency, cn } from "@/lib/utils";
import type { CreateBillInput, UpdateBillInput } from "@/lib/validations/bill.schema";
import type { OptimisticDebt } from "@/hooks/use-server-budget";

const MAX_VISIBLE_ITEMS = 3;

// ============================================
// SUBSCRIPTIONS SECTION
// ============================================

interface SubscriptionsSectionProps {
  subscriptions: OptimisticDebt[];
  currency: string;
  isPending?: boolean;
  onAdd: (data: CreateBillInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: UpdateBillInput) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid: (id: string, paidDate?: string) => Promise<{ success: boolean; error?: string }>;
  onResetStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function SubscriptionsSection({
  subscriptions,
  currency,
  isPending = false,
  onAdd,
  onUpdate,
  onDelete,
  onMarkPaid,
  onResetStatus,
}: SubscriptionsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OptimisticDebt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const visibleItems = subscriptions.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = subscriptions.length > MAX_VISIBLE_ITEMS;

  const handleMarkPaid = async (sub: OptimisticDebt) => {
    const result = await onMarkPaid(sub.id);
    if (result.success) {
      toast.success(`${sub.label} marked as paid`);
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  };

  const handleResetStatus = async (sub: OptimisticDebt) => {
    const result = await onResetStatus(sub.id);
    if (result.success) {
      toast.success(`${sub.label} status reset`);
    } else {
      toast.error(result.error ?? "Failed to reset status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await onDelete(deleteId);
    if (result.success) {
      toast.success("Subscription deleted");
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
    setDeleteId(null);
  };

  const handleEdit = (item: OptimisticDebt) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleFormSave = async (data: CreateBillInput) => {
    if (editingItem) {
      const result = await onUpdate(editingItem.id, data);
      if (result.success) {
        toast.success("Subscription updated");
        handleFormClose();
      } else {
        toast.error(result.error ?? "Failed to update subscription");
      }
    } else {
      const result = await onAdd(data);
      if (result.success) {
        toast.success("Subscription added");
        handleFormClose();
      } else {
        toast.error(result.error ?? "Failed to add subscription");
      }
    }
  };

  return (
    <>
      <BentoCard
        title="Subscriptions"
        icon={RefreshCw}
        iconColor="text-violet-600"
        iconBg="bg-violet-100"
        total={total}
        currency={currency}
        count={subscriptions.length}
        onAdd={() => setIsFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {subscriptions.length === 0 ? (
          <BentoCardEmpty
            message="No subscriptions yet"
            actionLabel="Add subscription"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-1">
            {visibleItems.map((sub) => (
              <SubscriptionCardCompact
                key={sub.id}
                item={sub}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(sub)}
                onResetStatus={() => handleResetStatus(sub)}
                onEdit={() => handleEdit(sub)}
                onDelete={() => setDeleteId(sub.id)}
              />
            ))}
          </div>
        )}
      </BentoCard>

      {/* View All Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-violet-600" />
              </div>
              All Subscriptions
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <SubscriptionCardFull
                key={sub.id}
                item={sub}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(sub)}
                onResetStatus={() => handleResetStatus(sub)}
                onEdit={() => handleEdit(sub)}
                onDelete={() => setDeleteId(sub.id)}
              />
            ))}
          </div>

          {/* Total Summary */}
          {subscriptions.length > 0 && (
            <div className="mt-4 p-3 bg-violet-50/50 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-violet-600 font-medium">
                  Total Monthly
                </span>
                <span className="text-lg font-bold text-violet-600 tabular-nums">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form */}
      <BillForm
        open={isFormOpen}
        onClose={handleFormClose}
        bill={editingItem}
        currency={currency}
        isDebt={false}
        onSave={handleFormSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact card for bento grid
function SubscriptionCardCompact({
  item,
  currency,
  isPending,
  onMarkPaid,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  item: OptimisticDebt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = item.status === "paid";
  const isOptimistic = item.pending;
  const frequencyLabels: Record<string, string> = {
    daily: "/day",
    weekly: "/wk",
    biweekly: "/2wk",
    monthly: "/mo",
    quarterly: "/qtr",
    yearly: "/yr",
    once: "",
  };
  const frequencyLabel = frequencyLabels[item.frequency] ?? "";

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-2 rounded-lg hover:bg-stone-50 transition-colors group",
        (isPending || isOptimistic) && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">{item.icon || "🔄"}</span>
        <span className="text-sm text-stone-700 truncate">{item.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-violet-600 tabular-nums">
          -{formatCurrency(item.amount, currency)}
          <span className="text-[10px] text-stone-400">{frequencyLabel}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="More options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPaid ? (
              <DropdownMenuItem onClick={onResetStatus}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Mark as Pending
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onMarkPaid}>
                <Check className="w-4 h-4 mr-2" />
                Mark as Paid
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Full card for sheet view
function SubscriptionCardFull({
  item,
  currency,
  isPending,
  onMarkPaid,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  item: OptimisticDebt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = item.status === "paid";
  const isOptimistic = item.pending;
  const frequencyLabels: Record<string, string> = {
    daily: "/day",
    weekly: "/wk",
    biweekly: "/2wk",
    monthly: "/mo",
    quarterly: "/qtr",
    yearly: "/yr",
    once: "",
  };
  const frequencyLabel = frequencyLabels[item.frequency] ?? "";

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-violet-200 transition-colors",
        (isPending || isOptimistic) && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">{item.icon || "🔄"}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-stone-900 truncate">
                {item.label}
              </p>
              <Badge
                variant={isPaid ? "default" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isPaid && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {isPaid ? "Paid" : "Pending"}
              </Badge>
            </div>
            {item.due_date && (
              <p className="text-xs text-stone-500">
                Renews {item.due_date}{getOrdinalSuffix(item.due_date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-violet-600 tabular-nums">
            -{formatCurrency(item.amount, currency)}
            <span className="text-xs font-normal text-stone-400">{frequencyLabel}</span>
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="More options">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPaid ? (
                <DropdownMenuItem onClick={onResetStatus}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Mark as Pending
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onMarkPaid}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PLANNED EXPENSES SECTION
// ============================================

interface PlannedExpensesSectionProps {
  expenses: OptimisticDebt[];
  currency: string;
  isPending?: boolean;
  onAdd: (data: CreateBillInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, data: UpdateBillInput) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onMarkPaid: (id: string, paidDate?: string) => Promise<{ success: boolean; error?: string }>;
  onResetStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function PlannedExpensesSection({
  expenses,
  currency,
  isPending = false,
  onAdd,
  onUpdate,
  onDelete,
  onMarkPaid,
  onResetStatus,
}: PlannedExpensesSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OptimisticDebt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const visibleItems = expenses.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = expenses.length > MAX_VISIBLE_ITEMS;

  const handleMarkPaid = async (expense: OptimisticDebt) => {
    const result = await onMarkPaid(expense.id);
    if (result.success) {
      toast.success(`${expense.label} marked as paid`);
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  };

  const handleResetStatus = async (expense: OptimisticDebt) => {
    const result = await onResetStatus(expense.id);
    if (result.success) {
      toast.success(`${expense.label} status reset`);
    } else {
      toast.error(result.error ?? "Failed to reset status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await onDelete(deleteId);
    if (result.success) {
      toast.success("Planned expense deleted");
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
    setDeleteId(null);
  };

  const handleEdit = (item: OptimisticDebt) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleFormSave = async (data: CreateBillInput) => {
    if (editingItem) {
      const result = await onUpdate(editingItem.id, data);
      if (result.success) {
        toast.success("Planned expense updated");
        handleFormClose();
      } else {
        toast.error(result.error ?? "Failed to update expense");
      }
    } else {
      const result = await onAdd(data);
      if (result.success) {
        toast.success("Planned expense added");
        handleFormClose();
      } else {
        toast.error(result.error ?? "Failed to add expense");
      }
    }
  };

  return (
    <>
      <BentoCard
        title="Planned Expenses"
        icon={Calendar}
        iconColor="text-blue-600"
        iconBg="bg-blue-100"
        total={total}
        currency={currency}
        count={expenses.length}
        onAdd={() => setIsFormOpen(true)}
        onViewAll={() => setIsSheetOpen(true)}
        showViewAll={hasMore}
      >
        {expenses.length === 0 ? (
          <BentoCardEmpty
            message="No planned expenses"
            actionLabel="Add planned expense"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-1">
            {visibleItems.map((expense) => (
              <PlannedCardCompact
                key={expense.id}
                item={expense}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(expense)}
                onResetStatus={() => handleResetStatus(expense)}
                onEdit={() => handleEdit(expense)}
                onDelete={() => setDeleteId(expense.id)}
              />
            ))}
          </div>
        )}
      </BentoCard>

      {/* View All Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              All Planned Expenses
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {expenses.map((expense) => (
              <PlannedCardFull
                key={expense.id}
                item={expense}
                currency={currency}
                isPending={isPending}
                onMarkPaid={() => handleMarkPaid(expense)}
                onResetStatus={() => handleResetStatus(expense)}
                onEdit={() => handleEdit(expense)}
                onDelete={() => setDeleteId(expense.id)}
              />
            ))}
          </div>

          {/* Total Summary */}
          {expenses.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">
                  Total Planned
                </span>
                <span className="text-lg font-bold text-blue-600 tabular-nums">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form */}
      <BillForm
        open={isFormOpen}
        onClose={handleFormClose}
        bill={editingItem}
        currency={currency}
        isDebt={false}
        onSave={handleFormSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Planned Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this planned expense? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact card for bento grid
function PlannedCardCompact({
  item,
  currency,
  isPending,
  onMarkPaid,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  item: OptimisticDebt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = item.status === "paid";
  const isOptimistic = item.pending;

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-2 rounded-lg hover:bg-stone-50 transition-colors group",
        (isPending || isOptimistic) && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">{item.icon || "📅"}</span>
        <span className="text-sm text-stone-700 truncate">{item.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-blue-600 tabular-nums">
          -{formatCurrency(item.amount, currency)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="More options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPaid ? (
              <DropdownMenuItem onClick={onResetStatus}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Mark as Pending
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onMarkPaid}>
                <Check className="w-4 h-4 mr-2" />
                Mark as Paid
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Full card for sheet view
function PlannedCardFull({
  item,
  currency,
  isPending,
  onMarkPaid,
  onResetStatus,
  onEdit,
  onDelete,
}: {
  item: OptimisticDebt;
  currency: string;
  isPending: boolean;
  onMarkPaid: () => void;
  onResetStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = item.status === "paid";
  const isOptimistic = item.pending;

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-stone-200 hover:border-blue-200 transition-colors",
        (isPending || isOptimistic) && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xl">{item.icon || "📅"}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-stone-900 truncate">
                {item.label}
              </p>
              <Badge
                variant={isPaid ? "default" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isPaid && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {isPaid ? "Paid" : "Planned"}
              </Badge>
            </div>
            {item.due_date && (
              <p className="text-xs text-stone-500">
                Planned for {item.due_date}{getOrdinalSuffix(item.due_date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-blue-600 tabular-nums">
            -{formatCurrency(item.amount, currency)}
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="More options">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPaid ? (
                <DropdownMenuItem onClick={onResetStatus}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Mark as Planned
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onMarkPaid}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

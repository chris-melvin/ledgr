"use client";

import { useMemo, useState } from "react";
import { X, Plus, Calendar, Clock, CreditCard, Banknote, Receipt, Check } from "lucide-react";
import { cn, formatCurrency, formatKey } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { LocalBill, LocalIncome, TimelineEvent } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as dateUtils from "@/lib/utils/date";

// Minimal expense interface that works with both LocalExpense and Expense from database
interface ExpenseItem {
  id: string;
  amount: number;
  label: string;
  category?: string | null;
  occurred_at: string;
}

interface DayTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  expenses: ExpenseItem[];
  bills: LocalBill[];
  incomes: LocalIncome[];
  dailyLimit: number;
  onAddExpense: (amount: number, label: string) => void;
  onMarkBillPaid?: (billId: string) => void;
  onMarkIncomeReceived?: (incomeId: string) => void;
}

// Event type colors and icons
const EVENT_CONFIG = {
  expense: {
    bgColor: "bg-stone-50",
    borderColor: "border-stone-200",
    iconBg: "bg-stone-100",
    textColor: "text-stone-700",
    icon: Receipt,
    prefix: "-",
  },
  bill: {
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    iconBg: "bg-rose-100",
    textColor: "text-rose-600",
    icon: CreditCard,
    prefix: "-",
  },
  bill_due: {
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    iconBg: "bg-rose-100",
    textColor: "text-rose-600",
    icon: CreditCard,
    prefix: "-",
  },
  bill_received: {
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconBg: "bg-orange-100",
    textColor: "text-orange-600",
    icon: CreditCard,
    prefix: "",
  },
  income: {
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    iconBg: "bg-emerald-100",
    textColor: "text-emerald-600",
    icon: Banknote,
    prefix: "+",
  },
};

export function DayTimelineModal({
  isOpen,
  onClose,
  selectedDate,
  expenses,
  bills,
  incomes,
  dailyLimit,
  onAddExpense,
  onMarkBillPaid,
  onMarkIncomeReceived,
}: DayTimelineModalProps) {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Build timeline events
  const { timelineEvents, totalSpent, remaining } = useMemo(() => {
    const events: TimelineEvent[] = [];
    const dateKey = formatKey(selectedDate);
    const dayOfMonth = selectedDate.getDate();
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    // Add expenses for this day
    // Filter by occurred_at timestamp
    expenses
      .filter((e) => {
        // Use occurred_at (required field) to filter by date
        const expenseDate = dateUtils.toDateString(e.occurred_at, dateUtils.DEFAULT_TIMEZONE);
        return expenseDate === dateKey;
      })
      .forEach((expense) => {
        events.push({
          id: expense.id,
          type: "expense",
          label: expense.label,
          amount: expense.amount,
          time: new Date(expense.occurred_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          icon: expense.category ? getCategoryIcon(expense.category) : undefined,
          originalData: expense,
        });
      });

    // Add bills due on this day
    bills.forEach((bill) => {
      let isDueToday = false;

      if (bill.dueDayOfMonth) {
        isDueToday = bill.dueDayOfMonth === dayOfMonth;
      } else if (bill.dueDate) {
        const dueDate = new Date(bill.dueDate);
        isDueToday =
          dueDate.getDate() === dayOfMonth &&
          dueDate.getMonth() === month &&
          dueDate.getFullYear() === year;
      }

      if (isDueToday) {
        events.push({
          id: `${bill.id}-due`,
          type: "bill_due",
          label: `${bill.label} Due`,
          amount: bill.amount,
          icon: bill.icon,
          status: bill.status,
          originalData: bill,
        });
      }

      // Check if bill was received today
      if (bill.receiveDate) {
        const receiveDate = new Date(bill.receiveDate);
        if (
          receiveDate.getDate() === dayOfMonth &&
          receiveDate.getMonth() === month &&
          receiveDate.getFullYear() === year
        ) {
          events.push({
            id: `${bill.id}-received`,
            type: "bill_received",
            label: `${bill.label} Received`,
            amount: bill.amount,
            icon: bill.icon,
            originalData: bill,
          });
        }
      }
    });

    // Add income expected/received on this day
    incomes.forEach((income) => {
      if (income.dayOfMonth === dayOfMonth) {
        events.push({
          id: income.id,
          type: "income",
          label: income.label,
          amount: income.amount,
          status: income.status,
          originalData: income,
        });
      }
    });

    // Sort by time (events without time go at the end)
    events.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    // Calculate totals
    const spent = events
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      timelineEvents: events,
      totalSpent: spent,
      remaining: dailyLimit - spent,
    };
  }, [selectedDate, expenses, bills, incomes, dailyLimit]);

  const handleAddExpense = () => {
    const amount = parseFloat(newAmount);
    if (amount > 0 && newLabel.trim()) {
      onAddExpense(amount, newLabel.trim());
      setNewAmount("");
      setNewLabel("");
      setIsAddingExpense(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
        {/* Header */}
        <div className="relative px-5 py-4 bg-gradient-to-br from-stone-50 to-stone-100 border-b border-stone-200">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-stone-500 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Day Details</span>
          </div>

          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold text-stone-800">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <div className="text-right">
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  remaining >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {formatCurrency(remaining, CURRENCY)}
              </span>
              <p className="text-[10px] text-stone-400">remaining</p>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-stone-300" />
              </div>
              <p className="text-stone-500 text-sm">No events for this day</p>
              <p className="text-stone-400 text-xs mt-1">Add an expense to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timelineEvents.map((event) => {
                const config = EVENT_CONFIG[event.type];
                const Icon = config.icon;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.iconBg)}>
                      {event.icon ? (
                        <span className="text-lg">{event.icon}</span>
                      ) : (
                        <Icon className={cn("h-5 w-5", config.textColor)} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{event.label}</p>
                      {event.time && (
                        <p className="text-[10px] text-stone-400">{event.time}</p>
                      )}
                      {event.status && event.type === "bill_due" && (
                        <Badge
                          variant={
                            event.status === "paid"
                              ? "paid"
                              : event.status === "overdue"
                              ? "overdue"
                              : "pending"
                          }
                          className="text-[9px] font-bold uppercase tracking-wider"
                        >
                          {event.status}
                        </Badge>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <span className={cn("text-sm font-bold tabular-nums", config.textColor)}>
                        {config.prefix}
                        {formatCurrency(event.amount, CURRENCY)}
                      </span>
                    </div>

                    {/* Actions */}
                    {event.type === "bill_due" && event.status === "pending" && onMarkBillPaid && (
                      <button
                        onClick={() => {
                          const bill = event.originalData as LocalBill;
                          onMarkBillPaid(bill.id);
                        }}
                        className="p-2 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Mark as paid"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Expense Section */}
        <div className="border-t border-stone-100 p-4 bg-stone-50/50">
          {isAddingExpense ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1"
                  autoFocus
                />
                <Input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddExpense()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingExpense(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExpense}
                  disabled={!newAmount || !newLabel.trim()}
                  className="flex-1"
                >
                  Add Expense
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAddingExpense(true)}
              className="w-full py-6 border-2 border-dashed border-stone-200 text-stone-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get category icon
function getCategoryIcon(category: string): string | undefined {
  const icons: Record<string, string> = {
    coffee: "☕",
    food: "🍱",
    transport: "🚌",
    shopping: "🛍️",
    entertainment: "🎬",
    groceries: "🛒",
  };
  return icons[category.toLowerCase()];
}

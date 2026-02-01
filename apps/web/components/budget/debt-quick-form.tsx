"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Banknote, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/ui/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBill } from "@/actions/bills";
import type { CreateBillInput } from "@/lib/validations/bill.schema";
import { cn } from "@/lib/utils";
import * as dateUtils from "@/lib/utils/date";

const DEBT_ICONS = ["💳", "💰", "🏠", "🚗", "🏦", "📱", "💸", "🎓"];

type DebtType = "one_time" | "recurring";

interface DebtQuickFormProps {
  open: boolean;
  onClose: () => void;
  currency: string;
  onSave?: (data: CreateBillInput) => Promise<void>;
}

// Auto-detect debt type and icon from name
function detectDebtType(name: string): { icon: string; type: string } {
  const lower = name.toLowerCase();

  if (/credit|card|visa|mastercard|bdo|bpi|metrobank|security|citibank|unionbank|rcbc|eastwest|pnb|chinabank|maybank/.test(lower)) {
    return { icon: "💳", type: "credit_card" };
  }
  if (/car|auto|vehicle|motor/.test(lower)) {
    return { icon: "🚗", type: "auto_loan" };
  }
  if (/house|home|mortgage|housing|pag-ibig|pagibig/.test(lower)) {
    return { icon: "🏠", type: "mortgage" };
  }
  if (/phone|mobile|iphone|samsung|gadget/.test(lower)) {
    return { icon: "📱", type: "gadget" };
  }
  if (/school|tuition|education|student/.test(lower)) {
    return { icon: "🎓", type: "education" };
  }
  if (/bank|sss|gsis/.test(lower)) {
    return { icon: "🏦", type: "bank_loan" };
  }
  if (/utang|loan|personal|borrowed|hiram/.test(lower)) {
    return { icon: "💰", type: "personal_loan" };
  }
  return { icon: "💰", type: "other" };
}

// Format number with commas
function formatNumber(value: string): string {
  const num = value.replace(/[^0-9.]/g, "");
  const parts = num.split(".");
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return parts.join(".");
}

// Parse formatted number back to plain number
function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, "");
}

export function DebtQuickForm({ open, onClose, currency, onSave }: DebtQuickFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debt type selection
  const [debtType, setDebtType] = useState<DebtType>("one_time");

  // Common fields
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💰");

  // One-time fields
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(""); // Full date YYYY-MM-DD
  const [creditor, setCreditor] = useState("");

  // Recurring fields
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [monthsRemaining, setMonthsRemaining] = useState("");

  // Advanced fields (recurring only)
  const [totalBalance, setTotalBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");

  // Auto-detect icon when name changes
  useEffect(() => {
    if (name && !showAdvanced) {
      const detected = detectDebtType(name);
      setIcon(detected.icon);
    }
  }, [name, showAdvanced]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDebtType("one_time");
      setName("");
      setAmount("");
      setDueDate("");
      setCreditor("");
      setMonthlyPayment("");
      setDueDay("");
      setMonthsRemaining("");
      setTotalBalance("");
      setInterestRate("");
      setIcon("💰");
      setShowAdvanced(false);
    }
  }, [open]);

  // Calculate end date from months remaining
  const calculateEndDate = (months: number): string => {
    const currentTimestamp = dateUtils.getCurrentTimestamp();
    // Add months to current date
    let timestamp = currentTimestamp;
    for (let i = 0; i < months; i++) {
      timestamp = dateUtils.addMonthsToTimestamp(timestamp, 1);
    }
    // Return as YYYY-MM-DD
    return dateUtils.toDateString(timestamp);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setAmount(formatted);
  };

  const handleMonthlyPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setMonthlyPayment(formatted);
  };

  const handleTotalBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setTotalBalance(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const today = dateUtils.getCurrentDateString();

    let data: CreateBillInput;

    if (debtType === "one_time") {
      // One-time debt
      const parsedAmount = parseFloat(parseFormattedNumber(amount));

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      data = {
        label: name.trim(),
        creditor: creditor.trim() || null,
        amount: parsedAmount,
        due_date: null, // One-time uses end_timestamp instead
        icon,
        frequency: "once" as const,
        is_recurring: false,
        is_active: true,
        payment_type: "fixed",
        payment_mode: "manual",
        total_amount: parsedAmount,
        remaining_balance: parsedAmount,
        interest_rate: null,
        minimum_payment: null,
        start_timestamp: dateUtils.toStartOfDayTimestamp(today),
        end_timestamp: dueDate ? dateUtils.toStartOfDayTimestamp(dueDate) : null,
      };
    } else {
      // Recurring debt
      const parsedAmount = parseFloat(parseFormattedNumber(monthlyPayment));
      const parsedTotal = totalBalance ? parseFloat(parseFormattedNumber(totalBalance)) : null;
      const parsedInterest = interestRate ? parseFloat(interestRate) / 100 : null;
      const parsedMonths = monthsRemaining ? parseInt(monthsRemaining, 10) : null;

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please enter a valid monthly payment");
        return;
      }

      const endDate = parsedMonths && parsedMonths > 0 ? calculateEndDate(parsedMonths) : null;

      data = {
        label: name.trim(),
        creditor: null,
        amount: parsedAmount,
        due_date: dueDay ? parseInt(dueDay, 10) : null,
        icon,
        frequency: "monthly" as const,
        is_recurring: true,
        is_active: true,
        payment_type: "fixed",
        payment_mode: "manual",
        total_amount: parsedTotal,
        remaining_balance: parsedTotal,
        interest_rate: parsedInterest,
        minimum_payment: parsedAmount,
        start_timestamp: dateUtils.toStartOfDayTimestamp(today),
        end_timestamp: endDate ? dateUtils.toStartOfDayTimestamp(endDate) : null,
      };
    }

    startTransition(async () => {
      if (onSave) {
        await onSave(data);
        return;
      }

      const result = await createBill(data);

      if (result.success) {
        toast.success("Debt added successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  const isOneTimeValid = name.trim() && amount;
  const isRecurringValid = name.trim() && monthlyPayment;
  const isFormValid = debtType === "one_time" ? isOneTimeValid : isRecurringValid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Debt</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debt Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDebtType("one_time")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                debtType === "one_time"
                  ? "border-amber-400 bg-amber-50 text-amber-900"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              <Banknote className="w-6 h-6" />
              <div className="text-center">
                <p className="font-medium text-sm">One-time</p>
                <p className="text-xs opacity-70">Pay once</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDebtType("recurring")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                debtType === "recurring"
                  ? "border-amber-400 bg-amber-50 text-amber-900"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              <CalendarClock className="w-6 h-6" />
              <div className="text-center">
                <p className="font-medium text-sm">Recurring</p>
                <p className="text-xs opacity-70">Monthly payments</p>
              </div>
            </button>
          </div>

          {/* Name field - common to both */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {debtType === "one_time" ? "What's this for?" : "Debt name"}
            </Label>
            <Input
              id="name"
              placeholder={debtType === "one_time" ? "e.g., Laptop, Borrowed money" : "e.g., BDO Card, Car Loan"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* One-time debt fields */}
          {debtType === "one_time" && (
            <>
              {/* Amount and Due Date in a row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                      {currency}
                    </span>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="5,000"
                      value={amount}
                      onChange={handleAmountChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Creditor */}
              <div className="space-y-2">
                <Label htmlFor="creditor">Who do you owe?</Label>
                <Input
                  id="creditor"
                  placeholder="e.g., Juan Santos, Globe"
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Recurring debt fields */}
          {debtType === "recurring" && (
            <>
              {/* Monthly Payment and Due Day */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Monthly payment</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                      {currency}
                    </span>
                    <Input
                      id="monthlyPayment"
                      type="text"
                      inputMode="decimal"
                      placeholder="5,000"
                      value={monthlyPayment}
                      onChange={handleMonthlyPaymentChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Due day</Label>
                  <Select value={dueDay} onValueChange={setDueDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}{day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="monthsRemaining">Duration</Label>
                <Select value={monthsRemaining} onValueChange={setMonthsRemaining}>
                  <SelectTrigger>
                    <SelectValue placeholder="How long? (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months (1 year)</SelectItem>
                    <SelectItem value="24">24 months (2 years)</SelectItem>
                    <SelectItem value="36">36 months (3 years)</SelectItem>
                    <SelectItem value="48">48 months (4 years)</SelectItem>
                    <SelectItem value="60">60 months (5 years)</SelectItem>
                  </SelectContent>
                </Select>
                {monthsRemaining && (
                  <p className="text-xs text-stone-500">
                    Target payoff: {new Date(new Date().getFullYear(), new Date().getMonth() + parseInt(monthsRemaining), 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </>
          )}

          {/* More Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Less options
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                More options
              </>
            )}
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              {/* Recurring-only advanced fields */}
              {debtType === "recurring" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="totalBalance">Total balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                        {currency}
                      </span>
                      <Input
                        id="totalBalance"
                        type="text"
                        inputMode="decimal"
                        placeholder="45,000"
                        value={totalBalance}
                        onChange={handleTotalBalanceChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest rate (APR)</Label>
                    <div className="relative">
                      <Input
                        id="interestRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="24.99"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                        %
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Icon picker - for both types */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  icons={DEBT_ICONS}
                  value={icon}
                  onChange={(emoji) => setIcon(emoji)}
                  color="amber"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isFormValid}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isPending ? "Adding..." : "Add Debt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

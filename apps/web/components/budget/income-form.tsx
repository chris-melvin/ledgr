"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIncome, updateIncome } from "@/actions/income";
import type { Income } from "@repo/database";
import type { CreateIncomeInput } from "@/lib/validations/income.schema";

interface IncomeFormProps {
  open: boolean;
  onClose: () => void;
  income?: Income | null;
  currency: string;
  onSave?: (data: CreateIncomeInput) => Promise<void>;
}

export function IncomeForm({ open, onClose, income, currency, onSave }: IncomeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [label, setLabel] = useState(income?.label ?? "");
  const [amount, setAmount] = useState(income?.amount?.toString() ?? "");
  // Include "daily" for compatibility with database type, though UI doesn't expose it
  type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "once";
  // Default to monthly, and convert "daily" to "monthly" for UI display since daily income is rare
  const initialFrequency = income?.frequency === "daily" ? "monthly" : (income?.frequency ?? "monthly");
  const [frequency, setFrequency] = useState<Frequency>(initialFrequency as Frequency);
  const [dayOfMonth, setDayOfMonth] = useState(
    income?.day_of_month?.toString() ?? ""
  );

  const isEditing = !!income;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateIncomeInput = {
      label: label.trim(),
      amount: parseFloat(amount),
      frequency: frequency as "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "once",
      day_of_month: dayOfMonth ? parseInt(dayOfMonth, 10) : null,
      is_active: true,
    };

    startTransition(async () => {
      // If onSave is provided, use it (optimistic mode)
      if (onSave) {
        await onSave(data);
        return;
      }

      // Fallback to direct server action (legacy mode)
      const result = isEditing
        ? await updateIncome(income.id, data)
        : await createIncome(data);

      if (result.success) {
        toast.success(isEditing ? "Income updated" : "Income added");
        router.refresh();
        handleClose();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  const handleClose = () => {
    setLabel(income?.label ?? "");
    setAmount(income?.amount?.toString() ?? "");
    const resetFrequency = income?.frequency === "daily" ? "monthly" : (income?.frequency ?? "monthly");
    setFrequency(resetFrequency as Frequency);
    setDayOfMonth(income?.day_of_month?.toString() ?? "");
    onClose();
  };

  // Reset form when income changes
  if (open && income && label !== income.label) {
    setLabel(income.label);
    setAmount(income.amount.toString());
    const editFrequency = income.frequency === "daily" ? "monthly" : income.frequency;
    setFrequency(editFrequency as Frequency);
    setDayOfMonth(income.day_of_month?.toString() ?? "");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Income" : "Add Income"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder="e.g., Salary, Freelance"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                {currency}
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-14"
                required
              />
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="once">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day of Month */}
          {frequency !== "once" && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Expected Day of Month</Label>
              <Select
                value={dayOfMonth}
                onValueChange={setDayOfMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                      {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

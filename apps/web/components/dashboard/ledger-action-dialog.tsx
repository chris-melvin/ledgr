"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Banknote, PiggyBank, Scale, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import {
  createLedgerInflow,
  createSavingsContribution,
  reconcileBalance,
} from "@/actions/ledger";

export type LedgerActionMode =
  | "income"
  | "savings_contribution"
  | "savings_withdrawal"
  | "reconcile";

interface LedgerActionDialogProps {
  mode: LedgerActionMode | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const MODE_CONFIG: Record<
  LedgerActionMode,
  {
    title: string;
    description: string;
    placeholder: string;
    cta: string;
    icon: typeof Banknote;
  }
> = {
  income: {
    title: "Add income",
    description: "Salary or any money coming in — adds to your running balance.",
    placeholder: "30000",
    cta: "Add income",
    icon: Banknote,
  },
  savings_contribution: {
    title: "Add to savings",
    description:
      "Money leaving the ledger. ledgr won't track it — it's out of the game.",
    placeholder: "5000",
    cta: "Move to savings",
    icon: PiggyBank,
  },
  savings_withdrawal: {
    title: "Withdraw from savings",
    description: "Money re-entering your spendable balance.",
    placeholder: "3000",
    cta: "Withdraw",
    icon: ArrowDownToLine,
  },
  reconcile: {
    title: "Reconcile balance",
    description:
      "Enter what you actually have. The difference is recorded as an adjustment.",
    placeholder: "12000",
    cta: "Reconcile",
    icon: Scale,
  },
};

/**
 * Keyboard-first mini-flow for ledger events (spending-clarity).
 * One amount input + optional note; Enter submits, Esc closes.
 */
export function LedgerActionDialog({
  mode,
  onClose,
  onSuccess,
}: LedgerActionDialogProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode) {
      setAmount("");
      setNote("");
      setError(null);
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  }, [mode]);

  const handleSubmit = useCallback(async () => {
    if (!mode || isSubmitting) return;
    const value = parseFloat(amount);
    if (Number.isNaN(value)) {
      setError("Enter a valid amount");
      return;
    }
    if (mode !== "reconcile" && value <= 0) {
      setError("Amount must be positive");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const trimmedNote = note.trim() || null;
    let result:
      | Awaited<ReturnType<typeof createLedgerInflow>>
      | Awaited<ReturnType<typeof reconcileBalance>>;
    let message = "";

    switch (mode) {
      case "income":
        result = await createLedgerInflow({ type: "income", amount: value, note: trimmedNote });
        message = "Income added!";
        break;
      case "savings_withdrawal":
        result = await createLedgerInflow({
          type: "savings_withdrawal",
          amount: value,
          note: trimmedNote,
        });
        message = "Withdrawal recorded!";
        break;
      case "savings_contribution":
        result = await createSavingsContribution({ amount: value, note: trimmedNote });
        message = "Moved to savings!";
        break;
      case "reconcile":
        result = await reconcileBalance({ actual_balance: value, note: trimmedNote });
        message = "Balance reconciled!";
        break;
    }

    setIsSubmitting(false);
    if (result.success) {
      onSuccess(message);
      onClose();
    } else {
      setError(result.error);
    }
  }, [mode, amount, note, isSubmitting, onSuccess, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleSubmit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  if (!mode) return null;

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-neutral-900">{config.title}</h2>
        </div>
        <p className="text-xs text-neutral-500 mb-4">{config.description}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/20">
            <span className="text-sm text-neutral-400">{CURRENCY}</span>
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              className="flex-1 min-w-0 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-300 tabular-nums"
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note (optional)"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || amount === ""}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white transition-colors",
              "hover:bg-neutral-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal-500"
            )}
          >
            {isSubmitting ? "Saving…" : config.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

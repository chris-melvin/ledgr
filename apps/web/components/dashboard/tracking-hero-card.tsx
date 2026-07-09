"use client";

import { useState } from "react";
import { Wallet, TrendingUp, Hourglass, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { setOpeningBalance } from "@/actions/ledger";
import type { SpendingStats } from "@/actions/ledger";

interface TrackingHeroCardProps {
  stats: SpendingStats | null;
  todayDailyTotal: number;
  onStatsChanged: () => void;
}

function signedCurrency(amount: number): string {
  const formatted = formatCurrency(amount, CURRENCY);
  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Tracking-mode hero (spending-clarity): running balance, today's Daily
 * total, trailing averages, and runway. Replaces the daily-limit hero
 * for tracking_only users.
 */
export function TrackingHeroCard({
  stats,
  todayDailyTotal,
  onStatsChanged,
}: TrackingHeroCardProps) {
  const [openingInput, setOpeningInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Opening balance empty state ──────────────────────────────────────
  if (stats && !stats.hasOpeningBalance) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(openingInput);
      if (Number.isNaN(amount) || amount < 0) {
        setSubmitError("Enter a valid starting balance");
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      const result = await setOpeningBalance({ amount });
      setIsSubmitting(false);
      if (result.success) {
        onStatsChanged();
      } else {
        setSubmitError(result.error);
      }
    };

    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-6 text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="text-base font-semibold text-neutral-900">
          What can you spend right now?
        </h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Enter your spendable money to start the running balance. Savings
          stay out of it — this is only what you&rsquo;re allowed to touch.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={openingInput}
            onChange={(e) => setOpeningInput(e.target.value)}
            placeholder={`${CURRENCY}0.00`}
            autoFocus
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 tabular-nums"
          />
          <button
            type="submit"
            disabled={isSubmitting || openingInput === ""}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
          >
            {isSubmitting ? "Saving…" : "Start"}
          </button>
        </form>
        {submitError && (
          <p className="text-xs text-rose-600 mt-2">{submitError}</p>
        )}
      </div>
    );
  }

  const balance = stats?.balance ?? 0;
  const collecting = stats?.collecting ?? true;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      {/* Running balance */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-1">
          Running balance
        </p>
        <p
          className={cn(
            "text-4xl sm:text-5xl font-bold tracking-tight tabular-nums",
            balance < 0 ? "text-rose-600" : "text-neutral-900"
          )}
        >
          {signedCurrency(balance)}
        </p>
        <p className="text-xs text-neutral-500 mt-1.5 tabular-nums">
          Today&rsquo;s daily spend: {formatCurrency(todayDailyTotal, CURRENCY)}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-neutral-100">
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-neutral-400 mb-0.5">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              Avg / day (7d)
            </span>
          </div>
          {collecting ? (
            <p className="text-xs text-neutral-400">
              collecting — {stats?.daysOfData ?? 0} of 7 days
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-neutral-800 tabular-nums">
                {formatCurrency(Math.round(stats!.mean7), CURRENCY)}
              </p>
              <p className="text-[10px] text-neutral-400 tabular-nums">
                median {formatCurrency(Math.round(stats!.median7), CURRENCY)}
              </p>
            </>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-neutral-400 mb-0.5">
            <Scale className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              Avg / day (30d)
            </span>
          </div>
          {collecting ? (
            <p className="text-xs text-neutral-400">—</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-neutral-800 tabular-nums">
                {formatCurrency(Math.round(stats!.mean30), CURRENCY)}
              </p>
              <p className="text-[10px] text-neutral-400 tabular-nums">
                median {formatCurrency(Math.round(stats!.median30), CURRENCY)}
              </p>
            </>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-neutral-400 mb-0.5">
            <Hourglass className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              Runway
            </span>
          </div>
          {stats?.runway === null || stats?.runway === undefined ? (
            <p className="text-sm font-semibold text-neutral-400">—</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-neutral-800 tabular-nums">
                {stats.runway} days
              </p>
              <p className="text-[10px] text-neutral-400">at current pace</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

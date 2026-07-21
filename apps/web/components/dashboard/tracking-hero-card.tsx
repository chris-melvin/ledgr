"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  Hourglass,
  Scale,
  Plus,
  CalendarClock,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { setOpeningBalance } from "@/actions/ledger";
import type { SpendingStats } from "@/actions/ledger";

/** Runway at or below this many days triggers the "time to top up" cue. */
const LOW_RUNWAY_DAYS = 7;

interface TrackingHeroCardProps {
  stats: SpendingStats | null;
  todayDailyTotal: number;
  onStatsChanged: () => void;
  /** Open the top-up (income) flow */
  onTopUp?: () => void;
  /** Open the plan-upcoming (scheduled events) flow */
  onPlanUpcoming?: () => void;
}

function signedCurrency(amount: number): string {
  const formatted = formatCurrency(amount, CURRENCY);
  return amount < 0 ? `-${formatted}` : formatted;
}

/** yyyy-MM-dd → "Aug 3" (noon avoids off-by-one across timezones). */
function formatShortDate(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  onTopUp,
  onPlanUpcoming,
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
  const runway = stats?.runway ?? null;
  const depletionDate = stats?.depletionDate ?? null;

  const isOver = balance < 0;
  const showTopUpCue = runway !== null && runway <= LOW_RUNWAY_DAYS;

  // Runway tile value + subtitle
  const runwayValue =
    runway !== null
      ? `${runway} ${runway === 1 ? "day" : "days"}`
      : balance > 0 && !collecting
        ? "1yr+"
        : "—";
  const runwaySub =
    runway !== null && depletionDate
      ? `until ${formatShortDate(depletionDate)}`
      : "at current pace";

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

      {/* Top-up cue: fires when you're over, or the runway is running low */}
      {(isOver || showTopUpCue) && (
        <div
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 border-t text-xs",
            isOver
              ? "bg-rose-50 border-rose-100 text-rose-700"
              : "bg-amber-50 border-amber-100 text-amber-800"
          )}
        >
          <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 min-w-0">
            {isOver
              ? "You're past zero — time to top up."
              : depletionDate
                ? `Runs low around ${formatShortDate(depletionDate)}.`
                : `About ${runway} ${runway === 1 ? "day" : "days"} left.`}
          </span>
          {onTopUp && (
            <button
              type="button"
              onClick={onTopUp}
              className={cn(
                "flex items-center gap-1 font-semibold rounded-full px-2.5 py-1 flex-shrink-0 transition-colors focus-visible:outline-2",
                isOver
                  ? "bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-500"
                  : "bg-amber-500 text-white hover:bg-amber-400 focus-visible:outline-amber-500"
              )}
            >
              <Plus className="w-3 h-3" />
              Top up
            </button>
          )}
        </div>
      )}

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
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              runway === null ? "text-neutral-400" : "text-neutral-800"
            )}
          >
            {runwayValue}
          </p>
          <p className="text-[10px] text-neutral-400">{runwaySub}</p>
        </div>
      </div>

      {/* Actions: top up + plan upcoming */}
      {(onTopUp || onPlanUpcoming) && (
        <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100">
          <button
            type="button"
            onClick={onTopUp}
            disabled={!onTopUp}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            Top up
          </button>
          <button
            type="button"
            onClick={onPlanUpcoming}
            disabled={!onPlanUpcoming}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
            Plan upcoming
          </button>
        </div>
      )}
    </div>
  );
}

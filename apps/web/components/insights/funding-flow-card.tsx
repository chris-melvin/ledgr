"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { FundingFlow } from "@/lib/insights/types";

interface FundingFlowCardProps {
  data: FundingFlow;
  periodLabel: string;
}

/**
 * Money in (top-ups) vs out (spending), net flow, and top-up cadence — the
 * heartbeat of the "top up when I need to" model (runway-forecast).
 */
export function FundingFlowCard({ data, periodLabel }: FundingFlowCardProps) {
  // Nothing to show if no money moved in the period
  if (data.added === 0 && data.spent === 0) return null;

  const positive = data.net >= 0;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Money In vs Out</h3>
        <span className="text-[11px] text-neutral-400">{periodLabel}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-neutral-100">
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              In
            </span>
          </div>
          <p className="text-lg font-bold text-neutral-900 tabular-nums">
            {formatCurrency(data.added, CURRENCY)}
          </p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 text-rose-500 mb-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              Out
            </span>
          </div>
          <p className="text-lg font-bold text-neutral-900 tabular-nums">
            {formatCurrency(data.spent, CURRENCY)}
          </p>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs text-neutral-500 flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5 text-neutral-400" /> Net flow
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {positive ? "+" : "−"}
          {formatCurrency(data.net, CURRENCY)}
        </span>
      </div>

      {data.topUpCount > 0 && (
        <div className="px-4 py-2 border-t border-neutral-100 text-[11px] text-neutral-400">
          {data.topUpCount} top-up{data.topUpCount === 1 ? "" : "s"}
          {data.cadenceDays !== null &&
            ` · about every ${data.cadenceDays} ${
              data.cadenceDays === 1 ? "day" : "days"
            }`}
          {` · avg ${formatCurrency(Math.round(data.avgTopUp), CURRENCY)}`}
        </div>
      )}
    </div>
  );
}

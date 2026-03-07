"use client";

import { Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface DayStatusProps {
  remaining: number;
}

export function DayStatus({ remaining }: DayStatusProps) {
  const isOver = remaining < 0;
  const message = isOver
    ? `Over by ${formatCurrency(remaining, CURRENCY)}. Consider adjusting tomorrow.`
    : `Safe! ${formatCurrency(remaining, CURRENCY)} left for today.`;

  return (
    <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-stone-900 mb-1">
          ledgr
        </h1>
        <p className="text-stone-400 text-sm uppercase tracking-widest flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Financial Freedom Logic
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 border-l border-stone-200 pl-6">
        <span className="text-xs text-stone-400 uppercase tracking-tighter">
          Day Status
        </span>
        <div
          className={cn(
            "text-xl font-medium",
            isOver ? "text-rose-500" : "text-emerald-600"
          )}
        >
          {message}
        </div>
      </div>
    </header>
  );
}

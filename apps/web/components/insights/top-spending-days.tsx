"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { TopSpendingDay } from "@/lib/insights/types";

interface TopSpendingDaysProps {
  data: TopSpendingDay[];
}

export function TopSpendingDays({ data }: TopSpendingDaysProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">
            Top Spending Days
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-400">No spending data yet</p>
        </div>
      </div>
    );
  }

  const maxTotal = data[0]?.total ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Top Spending Days
        </h3>
      </div>
      <div className="p-4 space-y-2.5">
        {data.map((day, i) => (
          <div key={day.date} className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-400 w-4 text-right tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm text-neutral-700">{day.dateLabel}</span>
                <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                  {formatCurrency(day.total, CURRENCY)}
                </span>
              </div>
              <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-500"
                  style={{
                    width: `${(day.total / maxTotal) * 100}%`,
                    opacity: 1 - i * 0.15,
                  }}
                />
              </div>
              {day.topExpense && (
                <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                  Top: {day.topExpense.description} ({formatCurrency(day.topExpense.amount, CURRENCY)})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

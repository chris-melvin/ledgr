"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CategoryTrendWeek } from "@/lib/insights/types";

interface CategoryTrendsProps {
  data: { weeks: CategoryTrendWeek[]; categories: string[] };
}

const TREND_COLORS = [
  "#1A9E9E", // teal
  "#E87356", // coral
  "#D4A843", // gold
  "#4A90D9", // blue
  "#5CB85C", // green
  "#8C8C8C", // neutral (Other)
];

export function CategoryTrends({ data }: CategoryTrendsProps) {
  const { weeks, categories } = data;

  if (categories.length === 0 || weeks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">
            Category Trends
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-400">
            Need more data to show trends
          </p>
        </div>
      </div>
    );
  }

  // Find max weekly total for scaling
  const weeklyTotals = weeks.map((w) =>
    Object.values(w.categories).reduce((s, v) => s + v, 0)
  );
  const maxTotal = Math.max(...weeklyTotals, 1);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Category Trends
        </h3>
        <p className="text-[10px] text-neutral-400 mt-0.5">Weekly breakdown</p>
      </div>
      <div className="p-4">
        {/* Stacked bars */}
        <div className="space-y-2.5">
          {weeks.map((week) => {
            const total = Object.values(week.categories).reduce((s, v) => s + v, 0);
            return (
              <div key={week.startDate}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-neutral-500">
                    {week.weekLabel}
                  </span>
                  <span className="text-[10px] text-neutral-400 tabular-nums">
                    {formatCurrency(total, CURRENCY)}
                  </span>
                </div>
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                  {categories.map((cat, i) => {
                    const amount = week.categories[cat] ?? 0;
                    if (amount === 0) return null;
                    const width = (amount / maxTotal) * 100;
                    return (
                      <div
                        key={cat}
                        className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: TREND_COLORS[i % TREND_COLORS.length],
                        }}
                        title={`${cat}: ${formatCurrency(amount, CURRENCY)}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
          {categories.map((cat, i) => (
            <div key={cat} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }}
              />
              <span className="text-[10px] text-neutral-500">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

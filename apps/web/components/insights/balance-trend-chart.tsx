"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { BalanceTrendPoint } from "@/lib/insights/types";

interface BalanceTrendChartProps {
  data: BalanceTrendPoint[];
}

/** Chart row: actual history and the dashed forecast are separate series so
 *  they render as solid + dashed. They overlap on the junction day (today) so
 *  the two segments connect without a gap. */
interface ChartRow {
  date: string;
  actual: number | null;
  projected: number | null;
}

function formatXLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const value = row.actual ?? row.projected ?? 0;
  const isProjected = row.actual === null;
  const d = new Date(row.date + "T12:00:00");
  const label = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const negative = value < 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-neutral-500">
        {label}
        {isProjected && (
          <span className="ml-1 text-[10px] text-blue-500">· projected</span>
        )}
      </p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          negative ? "text-rose-600" : "text-neutral-900"
        }`}
      >
        {negative ? "-" : ""}
        {formatCurrency(value, CURRENCY)}
      </p>
    </div>
  );
}

/**
 * Running balance over time since the opening snapshot, with a dashed forward
 * projection of where the balance is heading (runway-forecast). Single actual
 * series — the title names it; the dashed continuation is the forecast.
 */
export function BalanceTrendChart({ data }: BalanceTrendChartProps) {
  if (data.length < 2) return null;

  const actualPoints = data.filter((p) => !p.projected);
  const hasForecast = data.some((p) => p.projected);
  const todayIndex = actualPoints.length - 1;

  // Split into actual / projected series. The last actual point (today) is
  // also seeded into `projected` so the dashed line starts where solid ends.
  const rows: ChartRow[] = data.map((p, i) => {
    const isToday = !p.projected && i === todayIndex;
    return {
      date: p.date,
      actual: p.projected ? null : p.balance,
      projected: p.projected || isToday ? p.balance : null,
    };
  });

  const interval = rows.length > 12 ? Math.floor(rows.length / 6) : 0;
  const current = actualPoints[actualPoints.length - 1]?.balance ?? 0;
  const start = actualPoints[0]?.balance ?? 0;
  const delta = current - start;
  const endProjected = hasForecast ? data[data.length - 1]!.balance : null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Balance Trend</h3>
        <span
          className={`text-xs font-medium tabular-nums ${
            delta < 0 ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {delta < 0 ? "−" : "+"}
          {formatCurrency(delta, CURRENCY)} this period
        </span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={rows} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatXLabel}
              interval={interval}
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#d4d4d4", strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke="#e5e5e5" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#balanceFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {hasForecast && (
          <p className="text-[10px] text-neutral-400 mt-2 text-center">
            Dashed line projects your balance forward
            {endProjected !== null && endProjected < 0
              ? " — trending below zero"
              : ""}
            .
          </p>
        )}
      </div>
    </div>
  );
}

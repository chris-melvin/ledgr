"use client";

import {
  AreaChart,
  Area,
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

function formatXLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BalanceTrendPoint }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  const d = new Date(data.date + "T12:00:00");
  const label = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const negative = data.balance < 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          negative ? "text-rose-600" : "text-neutral-900"
        }`}
      >
        {negative ? "-" : ""}
        {formatCurrency(data.balance, CURRENCY)}
      </p>
    </div>
  );
}

/**
 * Running balance over time since the opening snapshot (spending-clarity).
 * Single series — the title names it, no legend needed.
 */
export function BalanceTrendChart({ data }: BalanceTrendChartProps) {
  if (data.length < 2) return null;

  const interval = data.length > 10 ? 4 : 0;
  const current = data[data.length - 1]!.balance;
  const start = data[0]!.balance;
  const delta = current - start;

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
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
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
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#balanceFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

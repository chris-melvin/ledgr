"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import * as dateUtils from "@/lib/utils/date";
import {
  getScheduledEvents,
  createScheduledEvent,
  deleteScheduledEvent,
} from "@/actions/scheduled-events";
import type { ScheduledEvent } from "@repo/database";

type Direction = "inflow" | "outflow";
type Recurrence = "none" | "weekly" | "biweekly" | "monthly";

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "One-time",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after any create/delete so the forecast + hero can refresh */
  onChanged: () => void;
  timezone: string;
}

/**
 * Plan upcoming money movements (bills out, income/top-ups in) that the runway
 * forecast projects against (runway-forecast). Self-contained: loads its own
 * list on open and refreshes stats after each mutation.
 */
export function ScheduleDialog({
  open,
  onClose,
  onChanged,
  timezone,
}: ScheduleDialogProps) {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<Direction>("outflow");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const result = await getScheduledEvents();
    setLoading(false);
    if (result.success) setEvents(result.data);
  }, []);

  useEffect(() => {
    if (open) {
      setDirection("outflow");
      setAmount("");
      setLabel("");
      setRecurrence("none");
      setError(null);
      setDate(dateUtils.getCurrentDateString(timezone));
      void loadEvents();
    }
  }, [open, timezone, loadEvents]);

  const handleAdd = async () => {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!label.trim()) {
      setError("Add a short label");
      return;
    }
    if (!date) {
      setError("Pick a date");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createScheduledEvent({
      direction,
      amount: value,
      label: label.trim(),
      next_at: dateUtils.toTimestamp(date, timezone),
      recurrence,
    });
    setSaving(false);
    if (result.success) {
      setAmount("");
      setLabel("");
      await loadEvents();
      onChanged();
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteScheduledEvent({ id });
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      onChanged();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-neutral-900">
              Plan upcoming
            </h2>
          </div>
          <p className="text-xs text-neutral-500">
            Add bills going out and income coming in. Your runway forecast
            factors these in.
          </p>
        </div>

        {/* Add form */}
        <div className="px-5 pb-3 space-y-2">
          <div className="inline-flex w-full bg-neutral-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setDirection("outflow")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                direction === "outflow"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Money out
            </button>
            <button
              type="button"
              onClick={() => setDirection("inflow")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                direction === "inflow"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Money in
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/20 w-32 flex-shrink-0">
              <span className="text-sm text-neutral-400">{CURRENCY}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full min-w-0 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-300 tabular-nums"
              />
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Rent, Salary"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-teal-400 bg-white"
            >
              {(Object.keys(RECURRENCE_LABELS) as Recurrence[]).map((k) => (
                <option key={k} value={k}>
                  {RECURRENCE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add to plan
          </button>
        </div>

        {/* List of planned events */}
        <div className="border-t border-neutral-100 flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              Loading…
            </div>
          ) : events.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-neutral-400">Nothing planned yet</p>
              <p className="text-xs text-neutral-300 mt-1">
                Add a bill or expected income above.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {events.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {ev.label}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {dateUtils.formatDate(ev.next_at, timezone, "MMM d")}
                      {ev.recurrence !== "none" &&
                        ` · ${RECURRENCE_LABELS[ev.recurrence]}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums flex-shrink-0",
                      ev.direction === "inflow"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}
                  >
                    {ev.direction === "inflow" ? "+" : "−"}
                    {formatCurrency(ev.amount, CURRENCY)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    aria-label={`Remove ${ev.label}`}
                    className="p-1.5 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

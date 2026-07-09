"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { toTimestamp, getCurrentTimestamp, formatInTimezone } from "@/lib/utils/date";
import { subDays } from "date-fns";

interface BucketOption {
  id: string;
  slug: string;
  name: string;
}

interface RegisterRow {
  label: string;
  amount: number;
  bucketId?: string;
  bucketSlug?: string;
}

interface RegisterModeProps {
  open: boolean;
  onClose: () => void;
  buckets: BucketOption[];
  defaultBucketId?: string;
  timezone: string;
  /** Commit staged rows in one batched call */
  onCommit: (
    rows: RegisterRow[],
    occurredAt: string
  ) => Promise<{ success: boolean }>;
}

type TargetDay = "today" | "yesterday";

/**
 * Register mode (spending-clarity): spreadsheet-style keyboard entry.
 * Enter stages the row and opens the next; Tab cycles the bucket;
 * Escape discards the in-progress row (or closes when empty).
 * Staged rows persist via ONE batched commit.
 */
export function RegisterMode({
  open,
  onClose,
  buckets,
  defaultBucketId,
  timezone,
  onCommit,
}: RegisterModeProps) {
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [draft, setDraft] = useState("");
  const [draftBucketId, setDraftBucketId] = useState<string | undefined>(defaultBucketId);
  const [targetDay, setTargetDay] = useState<TargetDay>("today");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRows([]);
      setDraft("");
      setDraftBucketId(defaultBucketId);
      setTargetDay("today");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, defaultBucketId]);

  const bucketById = useMemo(
    () => new Map(buckets.map((b) => [b.id, b])),
    [buckets]
  );

  const total = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  const cycleDraftBucket = useCallback(() => {
    if (buckets.length === 0) return;
    const currentIdx = buckets.findIndex((b) => b.id === draftBucketId);
    const next = buckets[(currentIdx + 1) % buckets.length]!;
    setDraftBucketId(next.id);
  }, [buckets, draftBucketId]);

  // Parse "label amount" — last pure-number token is the amount
  const parseDraft = useCallback((): RegisterRow | null => {
    const tokens = draft.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return null;

    let amountIdx = -1;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const cleaned = tokens[i]!.replace(/[₱$,]/g, "");
      if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
        amountIdx = i;
        break;
      }
    }
    if (amountIdx === -1) return null;

    const amount = parseFloat(tokens[amountIdx]!.replace(/[₱$,]/g, ""));
    const label = tokens.filter((_, i) => i !== amountIdx).join(" ") || "Expense";
    if (!(amount > 0)) return null;

    const bucket = draftBucketId ? bucketById.get(draftBucketId) : undefined;
    return { label, amount, bucketId: bucket?.id, bucketSlug: bucket?.slug };
  }, [draft, draftBucketId, bucketById]);

  const stageRow = useCallback(() => {
    const row = parseDraft();
    if (!row) return;
    setRows((prev) => [...prev, row]);
    setDraft("");
    setDraftBucketId(defaultBucketId);
    inputRef.current?.focus();
  }, [parseDraft, defaultBucketId]);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const occurredAt = useMemo(() => {
    if (targetDay === "today") return getCurrentTimestamp(timezone);
    // Backfilled entries log at 12:00 local on the target day
    const yesterday = subDays(new Date(), 1);
    const dayKey = formatInTimezone(yesterday, timezone, "yyyy-MM-dd");
    return toTimestamp(`${dayKey}T12:00:00`, timezone);
  }, [targetDay, timezone]);

  const saveAll = useCallback(async () => {
    if (rows.length === 0 || isSaving) return;
    setIsSaving(true);
    const result = await onCommit(rows, occurredAt);
    setIsSaving(false);
    if (result.success) {
      onClose();
    }
  }, [rows, isSaving, onCommit, occurredAt, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (draft.trim()) stageRow();
        void saveAll();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        stageRow();
        return;
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        cycleDraftBucket();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (draft.trim()) {
          // Discard the in-progress row only
          setDraft("");
          setDraftBucketId(defaultBucketId);
        } else {
          onClose();
        }
      }
    },
    [draft, stageRow, saveAll, cycleDraftBucket, defaultBucketId, onClose]
  );

  if (!open) return null;

  const draftBucket = draftBucketId ? bucketById.get(draftBucketId) : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header: title + day selector */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Register</h2>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
              {(["today", "yesterday"] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTargetDay(day)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full font-medium capitalize transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-teal-500",
                    targetDay === day
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Staged rows */}
          <div className="rounded-xl border border-neutral-200 overflow-hidden mb-3">
            {rows.length > 0 && (
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                {rows.map((row, i) => (
                  <div key={`${row.label}-${i}`} className="flex items-center gap-2 px-3 py-2">
                    <span className="flex-1 min-w-0 truncate text-sm text-neutral-800">
                      {row.label}
                    </span>
                    {row.bucketSlug && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700 font-medium uppercase tracking-wide flex-shrink-0">
                        {row.bucketSlug}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-neutral-700 tabular-nums flex-shrink-0">
                      {CURRENCY}
                      {row.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      aria-label={`Remove ${row.label}`}
                      className="p-0.5 text-neutral-300 hover:text-rose-500 transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-rose-400 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Draft row */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 bg-neutral-50/80",
                rows.length > 0 && "border-t border-neutral-200"
              )}
            >
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="fare 30"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
              />
              {draftBucket && (
                <button
                  type="button"
                  onClick={cycleDraftBucket}
                  title="Change bucket (Tab)"
                  className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600 font-medium uppercase tracking-wide hover:border-teal-400 hover:text-teal-600 transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-teal-500"
                >
                  {draftBucket.slug}
                </button>
              )}
            </div>
          </div>

          {/* Footer: session total + save */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 tabular-nums">
              {rows.length} {rows.length === 1 ? "item" : "items"} · {CURRENCY}
              {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-2 text-[10px] text-neutral-400">
                <span><kbd className="px-1 py-0.5 rounded bg-neutral-100 font-mono">↵</kbd> stage</span>
                <span><kbd className="px-1 py-0.5 rounded bg-neutral-100 font-mono">tab</kbd> bucket</span>
                <span><kbd className="px-1 py-0.5 rounded bg-neutral-100 font-mono">⌘↵</kbd> save</span>
              </span>
              <button
                type="button"
                onClick={saveAll}
                disabled={rows.length === 0 || isSaving}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                {isSaving ? "Saving…" : `Save ${rows.length || ""}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

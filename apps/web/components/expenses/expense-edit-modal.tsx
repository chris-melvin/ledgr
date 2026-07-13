"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import * as dateUtils from "@/lib/utils/date";
import type { BudgetBucket, Expense } from "@repo/database";

interface ExpenseEditModalProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    updates: {
      amount?: number;
      label?: string;
      bucket_id?: string | null;
      category?: string | null;
      notes?: string | null;
      occurred_at?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => void;
  buckets: BudgetBucket[];
  existingCategories: string[];
  timezone: string;
}

export function ExpenseEditModal({
  expense,
  open,
  onClose,
  onSave,
  onDelete,
  buckets,
  existingCategories,
  timezone,
}: ExpenseEditModalProps) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [bucketId, setBucketId] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setLabel(expense.label);
      setBucketId(expense.bucket_id || "");
      const cat = expense.category || "";
      setCategory(cat);
      setCustomCategory(cat !== "" && !existingCategories.includes(cat));
      setTime(dateUtils.formatDate(expense.occurred_at, timezone, "HH:mm"));
      setDate(dateUtils.formatDate(expense.occurred_at, timezone, "yyyy-MM-dd"));
      setNotes(expense.notes || "");
      setShowNotes(!!expense.notes);
    }
  }, [expense, timezone, existingCategories]);

  const selectedBucket = buckets.find((b) => b.id === bucketId);

  const handleSave = () => {
    if (!expense) return;

    const updates: {
      amount?: number;
      label?: string;
      bucket_id?: string | null;
      category?: string | null;
      notes?: string | null;
      occurred_at?: string;
    } = {};

    const newAmount = parseFloat(amount);
    if (!isNaN(newAmount) && newAmount > 0 && newAmount !== expense.amount) {
      updates.amount = newAmount;
    }
    if (label.trim() && label.trim() !== expense.label) {
      updates.label = label.trim();
    }
    if (bucketId !== (expense.bucket_id || "")) {
      updates.bucket_id = bucketId || null;
    }
    if (category !== (expense.category || "")) {
      updates.category = category || null;
    }
    if (notes !== (expense.notes || "")) {
      updates.notes = notes || null;
    }

    const originalTime = dateUtils.formatDate(expense.occurred_at, timezone, "HH:mm");
    const originalDate = dateUtils.formatDate(expense.occurred_at, timezone, "yyyy-MM-dd");
    if (time !== originalTime || date !== originalDate) {
      const [hours, mins] = time.split(":").map(Number);
      const [year, month, day] = date.split("-").map(Number);
      if (year && month && day && hours !== undefined && mins !== undefined) {
        const d = new Date(year, month - 1, day, hours, mins, 0, 0);
        updates.occurred_at = dateUtils.toTimestamp(d, timezone);
      }
    }

    // Close immediately (optimistic) — save runs in background
    onClose();
    if (Object.keys(updates).length > 0) {
      onSave(expense.id, updates).catch((err) => {
        console.error("[ExpenseEditModal] Save failed:", err);
      });
    }
  };

  const handleDelete = () => {
    if (!expense) return;
    onDelete(expense.id);
    onClose();
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__custom__") {
      setCustomCategory(true);
      setCategory("");
    } else {
      setCustomCategory(false);
      setCategory(value);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold text-neutral-900">
            Edit Expense
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Amount & Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                  {CURRENCY}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Bucket — decides whether this expense counts toward daily spending */}
          <div>
            <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
              Bucket
            </label>
            <select
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none"
            >
              <option value="">No bucket</option>
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-400 mt-1">
              {selectedBucket && !selectedBucket.include_in_daily_avg
                ? "Not counted toward daily spending."
                : "Counted toward daily spending."}
            </p>
          </div>

          {/* Category — optional, descriptive only */}
          <div>
            <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
              Category <span className="normal-case tracking-normal text-neutral-400">· optional</span>
            </label>
            {customCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Type a category..."
                  autoFocus
                  className="flex-1 text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={() => { setCustomCategory(false); setCategory(""); }}
                  className="text-xs text-neutral-400 hover:text-neutral-600 px-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none"
              >
                <option value="">No category</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">+ Custom...</option>
              </select>
            )}
          </div>

          {/* Time & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          {showNotes ? (
            <div>
              <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                maxLength={1000}
                className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowNotes(true)}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              + Add notes
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!amount || !label.trim()}
              className={cn(
                "px-5 py-2.5 text-xs font-medium rounded-lg transition-colors",
                !amount || !label.trim()
                  ? "bg-neutral-200 text-neutral-400"
                  : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]"
              )}
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

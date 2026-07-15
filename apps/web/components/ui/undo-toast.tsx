"use client";

import { toast } from "sonner";

/**
 * Show a toast notification with an undo action button.
 * The undo button is available for the duration of the toast (default 10 seconds).
 */
export function showUndoToast(
  message: string,
  onUndo: () => void | Promise<void>,
  options?: {
    duration?: number;
    description?: string;
  }
) {
  const { duration = 10000, description } = options ?? {};

  toast(message, {
    description,
    duration,
    action: {
      label: "Undo",
      onClick: async () => {
        try {
          await onUndo();
          toast.success("Action undone");
        } catch {
          toast.error("Failed to undo");
        }
      },
    },
  });
}

/**
 * Show a toast for expense deletion with undo capability.
 */
export function showExpenseDeletedToast(
  expenseLabel: string,
  onUndo: () => void | Promise<void>
) {
  showUndoToast(`${expenseLabel} deleted`, onUndo, {
    duration: 10000,
  });
}

/**
 * Ledger events are append-only so the running balance stays reconstructible.
 * Explain that, and offer the adjustment flow as the correction path.
 */
export function showLedgerAppendOnlyToast(onReconcile: () => void) {
  toast("Ledger entries can't be edited", {
    description:
      "They're a permanent record of money in and out. To correct your balance, add an adjustment.",
    duration: 8000,
    action: {
      label: "Adjust balance",
      onClick: onReconcile,
    },
  });
}

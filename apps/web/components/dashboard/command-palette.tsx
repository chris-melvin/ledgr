"use client";

import { useEffect, useRef, useCallback } from "react";
import { Command } from "cmdk";
import {
  Sparkles,
  TableProperties,
  Banknote,
  PiggyBank,
  ArrowDownToLine,
  Scale,
  CalendarDays,
  CalendarClock,
  BarChart3,
} from "lucide-react";
import type { LedgerActionMode } from "./ledger-action-dialog";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExpenses: () => void;
  onRegisterMode: () => void;
  onLedgerAction: (mode: LedgerActionMode) => void;
  onPlanUpcoming: () => void;
  onNavigateTab: (tab: "today" | "insights") => void;
  /** Ledger actions only make sense in tracking mode */
  showLedgerActions: boolean;
}

/**
 * Cmd+K command palette (spending-clarity). Linear-style: every primary
 * flow reachable and completable without a pointer.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onAddExpenses,
  onRegisterMode,
  onLedgerAction,
  onPlanUpcoming,
  onNavigateTab,
  showLedgerActions,
}: CommandPaletteProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Global Cmd+K / Ctrl+K binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k" && !e.shiftKey) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Save focus on open, restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus?.();
      previousFocusRef.current = null;
    }
  }, [open]);

  const run = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      // Let the palette unmount before the action opens its own surface
      setTimeout(action, 50);
    },
    [onOpenChange]
  );

  if (!open) return null;

  const itemClass =
    "flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-700 rounded-lg cursor-pointer select-none data-[selected=true]:bg-teal-50 data-[selected=true]:text-teal-800";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[18vh]"
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <Command
        label="Command palette"
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onOpenChange(false);
          }
        }}
      >
        <Command.Input
          autoFocus
          placeholder="Type a command…"
          className="w-full px-4 py-3.5 text-sm text-neutral-800 outline-none border-b border-neutral-100 placeholder:text-neutral-400"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-neutral-400">
            No matching commands
          </Command.Empty>

          <Command.Group
            heading="Add"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-neutral-400"
          >
            <Command.Item className={itemClass} onSelect={() => run(onAddExpenses)}>
              <Sparkles className="w-4 h-4 text-teal-500" />
              Add expenses
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-neutral-400">
                ⌘⇧K
              </kbd>
            </Command.Item>
            <Command.Item className={itemClass} onSelect={() => run(onRegisterMode)}>
              <TableProperties className="w-4 h-4 text-teal-500" />
              Register mode
            </Command.Item>
            {showLedgerActions && (
              <>
                <Command.Item
                  className={itemClass}
                  onSelect={() => run(() => onLedgerAction("income"))}
                >
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  Add income
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => run(() => onLedgerAction("savings_contribution"))}
                >
                  <PiggyBank className="w-4 h-4 text-violet-500" />
                  Add to savings
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => run(() => onLedgerAction("savings_withdrawal"))}
                >
                  <ArrowDownToLine className="w-4 h-4 text-violet-500" />
                  Withdraw from savings
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => run(() => onLedgerAction("reconcile"))}
                >
                  <Scale className="w-4 h-4 text-amber-500" />
                  Reconcile balance
                </Command.Item>
                <Command.Item className={itemClass} onSelect={() => run(onPlanUpcoming)}>
                  <CalendarClock className="w-4 h-4 text-blue-500" />
                  Plan upcoming
                </Command.Item>
              </>
            )}
          </Command.Group>

          <Command.Group
            heading="Go to"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-neutral-400"
          >
            <Command.Item
              className={itemClass}
              onSelect={() => run(() => onNavigateTab("today"))}
            >
              <CalendarDays className="w-4 h-4 text-neutral-400" />
              Go to Today
            </Command.Item>
            <Command.Item
              className={itemClass}
              onSelect={() => run(() => onNavigateTab("insights"))}
            >
              <BarChart3 className="w-4 h-4 text-neutral-400" />
              Go to Insights
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-neutral-100 text-[10px] text-neutral-400">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-neutral-100 font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-neutral-100 font-mono">↵</kbd> select
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-neutral-100 font-mono">esc</kbd> close
          </span>
        </div>
      </Command>
    </div>
  );
}

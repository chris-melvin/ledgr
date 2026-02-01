"use client";

import { useState, useCallback, useMemo } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import type { LocalBill } from "@/lib/types";

const STORAGE_KEY = "usemargin_bills";

// Load bills from localStorage
function loadBills(): LocalBill[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save bills to localStorage
function saveBills(bills: LocalBill[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  } catch {
    console.error("Failed to save bills to localStorage");
  }
}

/**
 * Hook for managing local bills with localStorage persistence
 *
 * Updated to use timezone-aware date utilities
 */
export function useBills(initialBills: LocalBill[] = []) {
  const { timezone } = useTimezone();
  const [bills, setBills] = useState<LocalBill[]>(() => {
    const stored = loadBills();
    return stored.length > 0 ? stored : initialBills;
  });

  // Add a new bill
  const addBill = useCallback(
    (bill: Omit<LocalBill, "id">) => {
      const newBill: LocalBill = {
        ...bill,
        id: `bill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      setBills((prev) => {
        const updated = [...prev, newBill];
        saveBills(updated);
        return updated;
      });
      return newBill;
    },
    []
  );

  // Update an existing bill
  const updateBill = useCallback(
    (id: string, updates: Partial<Omit<LocalBill, "id">>) => {
      setBills((prev) => {
        const updated = prev.map((bill) =>
          bill.id === id ? { ...bill, ...updates } : bill
        );
        saveBills(updated);
        return updated;
      });
    },
    []
  );

  // Delete a bill
  const deleteBill = useCallback((id: string) => {
    setBills((prev) => {
      const updated = prev.filter((bill) => bill.id !== id);
      saveBills(updated);
      return updated;
    });
  }, []);

  // Mark a bill as paid
  const markBillPaid = useCallback((id: string, paidDate?: string) => {
    const date = paidDate || dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");
    setBills((prev) => {
      const updated = prev.map((bill) =>
        bill.id === id
          ? { ...bill, status: "paid" as const, paidDate: date }
          : bill
      );
      saveBills(updated);
      return updated;
    });
  }, [timezone]);

  // Mark a bill as received (bill notice received)
  const markBillReceived = useCallback((id: string, receiveDate?: string) => {
    const date = receiveDate || dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");
    setBills((prev) => {
      const updated = prev.map((bill) =>
        bill.id === id ? { ...bill, receiveDate: date } : bill
      );
      saveBills(updated);
      return updated;
    });
  }, [timezone]);

  // Get bills due on a specific date
  const getBillsForDate = useCallback(
    (date: Date): LocalBill[] => {
      const dayOfMonth = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      return bills.filter((bill) => {
        // Check dueDayOfMonth for recurring bills
        if (bill.dueDayOfMonth) {
          return bill.dueDayOfMonth === dayOfMonth;
        }
        // Check specific dueDate
        if (bill.dueDate) {
          const dueDate = new Date(bill.dueDate);
          return (
            dueDate.getDate() === dayOfMonth &&
            dueDate.getMonth() === month &&
            dueDate.getFullYear() === year
          );
        }
        return false;
      });
    },
    [bills]
  );

  // Get overdue bills
  const overdueBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bills.filter((bill) => {
      if (bill.status === "paid") return false;

      if (bill.dueDate) {
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }
      return false;
    });
  }, [bills]);

  // Get pending bills (not paid, not overdue)
  const pendingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bills.filter((bill) => {
      if (bill.status === "paid") return false;

      if (bill.dueDate) {
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      }
      // Recurring bills without specific dueDate are always pending
      return bill.isRecurring;
    });
  }, [bills]);

  // Get total amount of pending bills
  const totalPendingAmount = useMemo(() => {
    return pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [pendingBills]);

  // Get total amount of overdue bills
  const totalOverdueAmount = useMemo(() => {
    return overdueBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [overdueBills]);

  // Update bill statuses based on current date
  const refreshBillStatuses = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setBills((prev) => {
      let hasChanges = false;
      const updated = prev.map((bill) => {
        if (bill.status === "paid") return bill;

        if (bill.dueDate) {
          const dueDate = new Date(bill.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today && bill.status !== "overdue") {
            hasChanges = true;
            return { ...bill, status: "overdue" as const };
          }
        }
        return bill;
      });

      if (hasChanges) {
        saveBills(updated);
      }
      return hasChanges ? updated : prev;
    });
  }, []);

  return {
    bills,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    markBillReceived,
    getBillsForDate,
    overdueBills,
    pendingBills,
    totalPendingAmount,
    totalOverdueAmount,
    refreshBillStatuses,
  };
}

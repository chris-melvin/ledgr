"use client";

import { useState, useCallback, useTransition } from "react";
import { getSpendingStats, type SpendingStats } from "@/actions/ledger";

/**
 * Client hook for running-balance spending stats (spending-clarity).
 * Server-rendered initial stats + on-demand refresh after mutations.
 */
export function useSpendingStats(initialStats: SpendingStats | null) {
  const [stats, setStats] = useState<SpendingStats | null>(initialStats);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const result = await getSpendingStats();
      if (result.success) {
        setStats(result.data);
      }
    });
  }, []);

  return { stats, refresh, isRefreshing: isPending };
}

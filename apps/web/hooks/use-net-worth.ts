"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";
import type { Asset, Liability, NetWorthSnapshot, DateRange } from "@/lib/types";

const ASSETS_KEY = "usemargin_assets";
const LIABILITIES_KEY = "usemargin_liabilities";
const SNAPSHOTS_KEY = "usemargin_net_worth_snapshots";

// Load from localStorage
function loadAssets(): Asset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(ASSETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadLiabilities(): Liability[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LIABILITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadSnapshots(): NetWorthSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save to localStorage
function saveAssets(assets: Asset[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  } catch {
    console.error("Failed to save assets");
  }
}

function saveLiabilities(liabilities: Liability[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIABILITIES_KEY, JSON.stringify(liabilities));
  } catch {
    console.error("Failed to save liabilities");
  }
}

function saveSnapshots(snapshots: NetWorthSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  } catch {
    console.error("Failed to save snapshots");
  }
}

// Generate demo data for visualization
function generateDemoSnapshots(timezone: string): NetWorthSnapshot[] {
  const snapshots: NetWorthSnapshot[] = [];
  const today = new Date();

  // Generate 12 months of demo data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthProgress = (12 - i) / 12;

    // Simulate growing assets and shrinking liabilities
    const baseAssets = 50000;
    const assetGrowth = monthProgress * 80000;
    const assetNoise = Math.random() * 10000 - 5000;

    const baseLiabilities = 40000;
    const liabilityReduction = monthProgress * 15000;
    const liabilityNoise = Math.random() * 3000 - 1500;

    const totalAssets = Math.round(baseAssets + assetGrowth + assetNoise);
    const totalLiabilities = Math.round(
      Math.max(0, baseLiabilities - liabilityReduction + liabilityNoise)
    );

    snapshots.push({
      date: dateUtils.formatInTimezone(date, timezone, "yyyy-MM-dd"),
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    });
  }

  return snapshots;
}

interface UseNetWorthReturn {
  assets: Asset[];
  liabilities: Liability[];
  snapshots: NetWorthSnapshot[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  isLoaded: boolean;
  addAsset: (asset: Omit<Asset, "id" | "lastUpdated">) => Asset;
  updateAsset: (id: string, updates: Partial<Omit<Asset, "id">>) => void;
  deleteAsset: (id: string) => void;
  addLiability: (liability: Omit<Liability, "id" | "lastUpdated">) => Liability;
  updateLiability: (id: string, updates: Partial<Omit<Liability, "id">>) => void;
  deleteLiability: (id: string) => void;
  takeSnapshot: () => void;
  getFilteredSnapshots: (dateRange: DateRange) => NetWorthSnapshot[];
}

/**
 * Hook for managing net worth tracking with timezone support
 *
 * Updated to use timezone-aware date utilities
 */
export function useNetWorth(): UseNetWorthReturn {
  const { timezone } = useTimezone();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedAssets = loadAssets();
    const storedLiabilities = loadLiabilities();
    let storedSnapshots = loadSnapshots();

    // If no snapshots, generate demo data
    if (storedSnapshots.length === 0) {
      storedSnapshots = generateDemoSnapshots(timezone);
      saveSnapshots(storedSnapshots);
    }

    setAssets(storedAssets);
    setLiabilities(storedLiabilities);
    setSnapshots(storedSnapshots);
    setIsLoaded(true);
  }, [timezone]);

  // Calculate totals
  const totalAssets = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.balance, 0),
    [assets]
  );

  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, liability) => sum + liability.balance, 0),
    [liabilities]
  );

  const netWorth = useMemo(
    () => totalAssets - totalLiabilities,
    [totalAssets, totalLiabilities]
  );

  // Asset operations
  const addAsset = useCallback((asset: Omit<Asset, "id" | "lastUpdated">) => {
    const newAsset: Asset = {
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      lastUpdated: new Date().toISOString(),
    };
    setAssets((prev) => {
      const updated = [...prev, newAsset];
      saveAssets(updated);
      return updated;
    });
    return newAsset;
  }, []);

  const updateAsset = useCallback(
    (id: string, updates: Partial<Omit<Asset, "id">>) => {
      setAssets((prev) => {
        const updated = prev.map((asset) =>
          asset.id === id
            ? { ...asset, ...updates, lastUpdated: new Date().toISOString() }
            : asset
        );
        saveAssets(updated);
        return updated;
      });
    },
    []
  );

  const deleteAsset = useCallback((id: string) => {
    setAssets((prev) => {
      const updated = prev.filter((asset) => asset.id !== id);
      saveAssets(updated);
      return updated;
    });
  }, []);

  // Liability operations
  const addLiability = useCallback(
    (liability: Omit<Liability, "id" | "lastUpdated">) => {
      const newLiability: Liability = {
        ...liability,
        id: `liability-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        lastUpdated: new Date().toISOString(),
      };
      setLiabilities((prev) => {
        const updated = [...prev, newLiability];
        saveLiabilities(updated);
        return updated;
      });
      return newLiability;
    },
    []
  );

  const updateLiability = useCallback(
    (id: string, updates: Partial<Omit<Liability, "id">>) => {
      setLiabilities((prev) => {
        const updated = prev.map((liability) =>
          liability.id === id
            ? { ...liability, ...updates, lastUpdated: new Date().toISOString() }
            : liability
        );
        saveLiabilities(updated);
        return updated;
      });
    },
    []
  );

  const deleteLiability = useCallback((id: string) => {
    setLiabilities((prev) => {
      const updated = prev.filter((liability) => liability.id !== id);
      saveLiabilities(updated);
      return updated;
    });
  }, []);

  // Take a snapshot of current net worth
  const takeSnapshot = useCallback(() => {
    const today = dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");
    const snapshot: NetWorthSnapshot = {
      date: today,
      totalAssets,
      totalLiabilities,
      netWorth,
    };

    setSnapshots((prev) => {
      // Replace if snapshot for today exists
      const filtered = prev.filter((s) => s.date !== today);
      const updated = [...filtered, snapshot].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      saveSnapshots(updated);
      return updated;
    });
  }, [totalAssets, totalLiabilities, netWorth, timezone]);

  // Filter snapshots by date range
  const getFilteredSnapshots = useCallback(
    (dateRange: DateRange): NetWorthSnapshot[] => {
      return snapshots.filter((snapshot) => {
        return snapshot.date >= dateRange.start && snapshot.date <= dateRange.end;
      });
    },
    [snapshots]
  );

  return {
    assets,
    liabilities,
    snapshots,
    totalAssets,
    totalLiabilities,
    netWorth,
    isLoaded,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
    takeSnapshot,
    getFilteredSnapshots,
  };
}

"use client";

import { useState, useCallback, useEffect } from "react";

export interface CustomShortcut {
  id: string;
  trigger: string; // e.g., "book" (without @)
  label: string; // e.g., "Book Purchase"
  category?: string;
  icon?: string;
  createdAt: string; // ISO string
}

interface UseShortcutsReturn {
  shortcuts: CustomShortcut[];
  addShortcut: (trigger: string, label: string, icon?: string, category?: string) => CustomShortcut;
  updateShortcut: (id: string, updates: Partial<Omit<CustomShortcut, "id" | "createdAt">>) => void;
  deleteShortcut: (id: string) => void;
  findByTrigger: (trigger: string) => CustomShortcut | undefined;
  isValidTrigger: (trigger: string, excludeId?: string) => boolean;
}

const STORAGE_KEY = "ledgr-shortcuts";

// Generate unique ID
function generateId(): string {
  return `sc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Normalize trigger (lowercase, remove @ if present, trim)
function normalizeTrigger(trigger: string): string {
  return trigger.toLowerCase().replace(/^@/, "").trim();
}

export function useShortcuts(): UseShortcutsReturn {
  const [shortcuts, setShortcuts] = useState<CustomShortcut[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setShortcuts(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load shortcuts from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when shortcuts change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
      } catch (error) {
        console.error("Failed to save shortcuts to localStorage:", error);
      }
    }
  }, [shortcuts, isLoaded]);

  // Find shortcut by trigger
  const findByTrigger = useCallback(
    (trigger: string): CustomShortcut | undefined => {
      const normalized = normalizeTrigger(trigger);
      return shortcuts.find((s) => s.trigger === normalized);
    },
    [shortcuts]
  );

  // Check if trigger is valid (unique and not empty)
  const isValidTrigger = useCallback(
    (trigger: string, excludeId?: string): boolean => {
      const normalized = normalizeTrigger(trigger);
      if (!normalized || normalized.length < 2) return false;

      // Check for duplicates
      const existing = shortcuts.find(
        (s) => s.trigger === normalized && s.id !== excludeId
      );
      return !existing;
    },
    [shortcuts]
  );

  // Add new shortcut
  const addShortcut = useCallback(
    (trigger: string, label: string, icon?: string, category?: string): CustomShortcut => {
      const normalizedTrigger = normalizeTrigger(trigger);

      const newShortcut: CustomShortcut = {
        id: generateId(),
        trigger: normalizedTrigger,
        label: label.trim(),
        icon,
        category,
        createdAt: new Date().toISOString(),
      };

      setShortcuts((prev) => [...prev, newShortcut]);
      return newShortcut;
    },
    []
  );

  // Update existing shortcut
  const updateShortcut = useCallback(
    (id: string, updates: Partial<Omit<CustomShortcut, "id" | "createdAt">>) => {
      setShortcuts((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;

          return {
            ...s,
            ...updates,
            trigger: updates.trigger ? normalizeTrigger(updates.trigger) : s.trigger,
            label: updates.label ? updates.label.trim() : s.label,
          };
        })
      );
    },
    []
  );

  // Delete shortcut
  const deleteShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    shortcuts,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    findByTrigger,
    isValidTrigger,
  };
}

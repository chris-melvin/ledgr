"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { updateSettings } from "@/actions/settings/update-settings";
import { type CardPreferences, CARD_PREFERENCE_DEFAULTS } from "./card-theme";

export function useCardCustomization(initial?: CardPreferences) {
  const [prefs, setPrefs] = useState<Required<CardPreferences>>(() => ({
    ...CARD_PREFERENCE_DEFAULTS,
    ...initial,
  }));
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with initial props on re-render (e.g., after server refresh)
  useEffect(() => {
    if (initial) {
      setPrefs((prev) => ({ ...prev, ...initial }));
    }
  }, [initial]);

  const save = useCallback((updated: Required<CardPreferences>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateSettings({ card_preferences: updated as Record<string, unknown> });
    }, 500);
  }, []);

  const update = useCallback(
    <K extends keyof CardPreferences>(key: K, value: CardPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        save(next);
        return next;
      });
    },
    [save]
  );

  return { prefs, update };
}

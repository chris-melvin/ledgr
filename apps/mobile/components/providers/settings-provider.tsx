import { createContext, useContext, type ReactNode } from "react";
import { useSettings, type UserSettings } from "@/hooks/use-settings";

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  isPro: boolean;
  updateSetting: (
    key: keyof Omit<UserSettings, "id" | "user_id">,
    value: string | number | boolean
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettingsContext must be used within SettingsProvider");
  }
  return ctx;
}

import React, { createContext, useContext } from "react";
import * as Localization from "expo-localization";

interface TimezoneContextType {
  timezone: string;
}

const TimezoneContext = createContext<TimezoneContextType>({
  timezone: "UTC",
});

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const timezone = Localization.getCalendars()[0]?.timeZone ?? "UTC";

  return (
    <TimezoneContext.Provider value={{ timezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  return useContext(TimezoneContext).timezone;
}

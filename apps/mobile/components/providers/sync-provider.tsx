import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { SyncEngine, type SyncStatus } from "@/lib/sync/sync-engine";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";

interface SyncContextType {
  status: SyncStatus;
  sync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  status: "idle",
  sync: async () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const engineRef = useRef<SyncEngine | null>(null);

  useEffect(() => {
    if (!user) {
      engineRef.current?.stop();
      engineRef.current = null;
      setStatus("idle");
      return;
    }

    const engine = new SyncEngine(db, supabase, user.id);
    engineRef.current = engine;

    const unsubscribe = engine.subscribe(setStatus);
    engine.start();

    return () => {
      unsubscribe();
      engine.stop();
      engineRef.current = null;
    };
  }, [db, user]);

  const sync = async () => {
    await engineRef.current?.sync();
  };

  return (
    <SyncContext.Provider value={{ status, sync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}

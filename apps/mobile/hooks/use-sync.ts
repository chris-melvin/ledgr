import { useSync as useSyncContext } from "@/components/providers/sync-provider";

export function useSyncStatus() {
  const { status, sync } = useSyncContext();

  return {
    status,
    isOnline: status !== "offline",
    isSyncing: status === "syncing",
    hasError: status === "error",
    triggerSync: sync,
  };
}

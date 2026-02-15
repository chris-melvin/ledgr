import type { SQLiteDatabase } from "expo-sqlite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NetworkMonitor } from "./network";
import { pushChanges } from "./push";
import { pullChanges } from "./pull";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

type SyncListener = (status: SyncStatus) => void;

const SYNC_INTERVAL_MS = 30_000;

export class SyncEngine {
  private status: SyncStatus = "idle";
  private listeners: Set<SyncListener> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private networkMonitor: NetworkMonitor;
  private networkUnsubscribe: (() => void) | null = null;

  constructor(
    private db: SQLiteDatabase,
    private supabase: SupabaseClient,
    private userId: string
  ) {
    this.networkMonitor = new NetworkMonitor();
  }

  start(): void {
    this.networkMonitor.start();
    this.networkUnsubscribe = this.networkMonitor.subscribe((isConnected) => {
      if (isConnected) {
        if (this.status === "offline") {
          this.setStatus("idle");
        }
        // Immediate sync when reconnecting
        this.sync();
      } else {
        this.setStatus("offline");
      }
    });

    this.startPeriodicSync();
  }

  stop(): void {
    this.stopPeriodicSync();
    this.networkUnsubscribe?.();
    this.networkMonitor.stop();
    this.listeners.clear();
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  async sync(): Promise<void> {
    if (this.status === "syncing") return;
    if (!this.networkMonitor.getIsConnected()) {
      this.setStatus("offline");
      return;
    }

    this.setStatus("syncing");

    try {
      // Push first to avoid overwriting local changes
      await pushChanges(this.db, this.supabase);
      // Then pull remote changes
      await pullChanges(this.db, this.supabase, this.userId);
      this.setStatus("idle");
    } catch (error) {
      console.error("[SyncEngine] Sync failed:", error);
      this.setStatus("error");
    }
  }

  private startPeriodicSync(): void {
    this.stopPeriodicSync();
    this.intervalId = setInterval(() => this.sync(), SYNC_INTERVAL_MS);
  }

  private stopPeriodicSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}

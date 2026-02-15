import * as Network from "expo-network";
import { AppState, type AppStateStatus } from "react-native";

type NetworkCallback = (isConnected: boolean) => void;

export class NetworkMonitor {
  private listeners: Set<NetworkCallback> = new Set();
  private isConnected = true;
  private isChecking = false;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  start(): void {
    // Check initial state
    this.checkConnection();

    // Listen for app state changes to re-check connectivity
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange
    );
  }

  stop(): void {
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.listeners.clear();
  }

  subscribe(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    // Immediately notify with current state
    callback(this.isConnected);
    return () => this.listeners.delete(callback);
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  private handleAppStateChange = (state: AppStateStatus): void => {
    if (state === "active") {
      this.checkConnection();
    }
  };

  private async checkConnection(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = networkState.isConnected ?? false;

      if (connected !== this.isConnected) {
        this.isConnected = connected;
        this.notifyListeners();
      }
    } catch (error) {
      console.warn("[NetworkMonitor] Failed to check connection:", error);
      // If we can't check, assume connected
      if (!this.isConnected) {
        this.isConnected = true;
        this.notifyListeners();
      }
    } finally {
      this.isChecking = false;
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.isConnected);
    }
  }
}

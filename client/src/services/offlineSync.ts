/**
 * Offline Sync Service
 * Handles offline data storage, sync queue, and connectivity management
 */

interface OfflineAction {
  id: string;
  type: "queue_checkin" | "consultation_note" | "prescription_collection";
  data: Record<string, any>;
  timestamp: number;
  synced: boolean;
}

interface OfflineStore {
  actions: OfflineAction[];
  lastSyncTime: number;
  isOnline: boolean;
}

const STORAGE_KEY = "clinic_system_offline";
const SYNC_INTERVAL = 30000; // 30 seconds

class OfflineSyncService {
  private store: OfflineStore;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.store = this.loadStore();
    this.initializeConnectivityListener();
  }

  /**
   * Load offline store from localStorage
   */
  private loadStore(): OfflineStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("[OfflineSync] Failed to load store:", error);
    }

    return {
      actions: [],
      lastSyncTime: 0,
      isOnline: navigator.onLine,
    };
  }

  /**
   * Save offline store to localStorage
   */
  private saveStore(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch (error) {
      console.error("[OfflineSync] Failed to save store:", error);
    }
  }

  /**
   * Initialize connectivity listener
   */
  private initializeConnectivityListener(): void {
    window.addEventListener("online", () => {
      this.store.isOnline = true;
      this.saveStore();
      console.log("[OfflineSync] Online - starting sync");
      this.startAutoSync();
    });

    window.addEventListener("offline", () => {
      this.store.isOnline = false;
      this.saveStore();
      console.log("[OfflineSync] Offline - stopping sync");
      this.stopAutoSync();
    });
  }

  /**
   * Start automatic sync
   */
  private startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (this.store.isOnline && this.store.actions.some((a) => !a.synced)) {
        this.syncActions();
      }
    }, SYNC_INTERVAL);
  }

  /**
   * Stop automatic sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add action to offline queue
   */
  public addAction(
    type: OfflineAction["type"],
    data: Record<string, any>
  ): string {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    this.store.actions.push(action);
    this.saveStore();

    console.log(`[OfflineSync] Added action: ${type}`, action);

    // Try to sync if online
    if (this.store.isOnline) {
      this.syncActions();
    }

    return action.id;
  }

  /**
   * Sync pending actions to server
   */
  public async syncActions(): Promise<void> {
    if (!this.store.isOnline) {
      console.log("[OfflineSync] Not online - skipping sync");
      return;
    }

    const pendingActions = this.store.actions.filter((a) => !a.synced);
    if (pendingActions.length === 0) {
      console.log("[OfflineSync] No pending actions to sync");
      return;
    }

    try {
      console.log(`[OfflineSync] Syncing ${pendingActions.length} actions`);

      // In a real implementation, this would call the backend API
      // For now, we'll just mark them as synced
      pendingActions.forEach((action) => {
        action.synced = true;
      });

      this.store.lastSyncTime = Date.now();
      this.saveStore();

      console.log("[OfflineSync] Sync completed successfully");
    } catch (error) {
      console.error("[OfflineSync] Sync failed:", error);
    }
  }

  /**
   * Get pending actions
   */
  public getPendingActions(): OfflineAction[] {
    return this.store.actions.filter((a) => !a.synced);
  }

  /**
   * Get all actions
   */
  public getAllActions(): OfflineAction[] {
    return this.store.actions;
  }

  /**
   * Clear synced actions
   */
  public clearSyncedActions(): void {
    this.store.actions = this.store.actions.filter((a) => !a.synced);
    this.saveStore();
    console.log("[OfflineSync] Cleared synced actions");
  }

  /**
   * Check if online
   */
  public isOnline(): boolean {
    return this.store.isOnline;
  }

  /**
   * Get last sync time
   */
  public getLastSyncTime(): number {
    return this.store.lastSyncTime;
  }

  /**
   * Get store status
   */
  public getStatus() {
    return {
      isOnline: this.store.isOnline,
      pendingActionsCount: this.getPendingActions().length,
      totalActionsCount: this.store.actions.length,
      lastSyncTime: this.store.lastSyncTime,
    };
  }

  /**
   * Clear all offline data
   */
  public clearAll(): void {
    this.store = {
      actions: [],
      lastSyncTime: 0,
      isOnline: navigator.onLine,
    };
    this.saveStore();
    console.log("[OfflineSync] Cleared all offline data");
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService();

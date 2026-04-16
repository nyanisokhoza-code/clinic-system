/**
 * Offline Cache Service
 * Manages caching of critical data for offline access
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStore {
  [key: string]: CacheEntry<any>;
}

const CACHE_STORAGE_KEY = "clinic_system_cache";
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

class OfflineCacheService {
  private cache: CacheStore;

  constructor() {
    this.cache = this.loadCache();
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): CacheStore {
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("[OfflineCache] Failed to load cache:", error);
    }

    return {};
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error("[OfflineCache] Failed to save cache:", error);
    }
  }

  /**
   * Set cache entry
   */
  public set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.saveCache();
    console.log(`[OfflineCache] Cached: ${key}`);
  }

  /**
   * Get cache entry
   */
  public get<T>(key: string): T | null {
    const entry = this.cache[key];

    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      delete this.cache[key];
      this.saveCache();
      console.log(`[OfflineCache] Expired: ${key}`);
      return null;
    }

    console.log(`[OfflineCache] Retrieved: ${key}`);
    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove cache entry
   */
  public remove(key: string): void {
    delete this.cache[key];
    this.saveCache();
    console.log(`[OfflineCache] Removed: ${key}`);
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache = {};
    this.saveCache();
    console.log("[OfflineCache] Cleared all cache");
  }

  /**
   * Get cache statistics
   */
  public getStats() {
    const entries = Object.entries(this.cache);
    const validEntries = entries.filter(
      ([_, entry]) => Date.now() - entry.timestamp <= entry.ttl
    );

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      cacheSize: new Blob([JSON.stringify(this.cache)]).size,
    };
  }

  /**
   * Cache patient data
   */
  public cachePatientData(patientId: number, data: any): void {
    this.set(`patient_${patientId}`, data, DEFAULT_TTL);
  }

  /**
   * Get cached patient data
   */
  public getPatientData(patientId: number): any {
    return this.get(`patient_${patientId}`);
  }

  /**
   * Cache clinic data
   */
  public cacheClinicData(clinicId: number, data: any): void {
    this.set(`clinic_${clinicId}`, data, DEFAULT_TTL);
  }

  /**
   * Get cached clinic data
   */
  public getClinicData(clinicId: number): any {
    return this.get(`clinic_${clinicId}`);
  }

  /**
   * Cache queue data
   */
  public cacheQueueData(queueId: number, data: any): void {
    this.set(`queue_${queueId}`, data, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get cached queue data
   */
  public getQueueData(queueId: number): any {
    return this.get(`queue_${queueId}`);
  }

  /**
   * Cache prescription data
   */
  public cachePrescriptionData(prescriptionId: number, data: any): void {
    this.set(`prescription_${prescriptionId}`, data, DEFAULT_TTL);
  }

  /**
   * Get cached prescription data
   */
  public getPrescriptionData(prescriptionId: number): any {
    return this.get(`prescription_${prescriptionId}`);
  }
}

// Export singleton instance
export const offlineCache = new OfflineCacheService();

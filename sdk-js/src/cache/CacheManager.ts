import { LRUCache, CacheOptions } from './LRUCache';
import { StorageAdapter, createStorageAdapter } from './StorageAdapter';
import { CacheConfig } from '../types';

export interface CacheManagerOptions {
  cacheConfig: CacheConfig;
  storageType?: 'memory' | 'localStorage' | 'sessionStorage';
  keyPrefix?: string;
}

export interface CachedFlag {
  key: string;
  value: any;
  enabled: boolean;
  version?: string;
  targeting?: any;
  metadata?: Record<string, any>;
}

/**
 * Cache manager that combines in-memory LRU cache with persistent storage
 */
export class CacheManager {
  private memoryCache: LRUCache<CachedFlag>;
  private storageAdapter: StorageAdapter;
  private keyPrefix: string;
  private backgroundRefreshEnabled = false;
  private refreshInterval?: NodeJS.Timeout;

  constructor(options: CacheManagerOptions) {
    const { cacheConfig, storageType = 'memory', keyPrefix = 'flags_' } = options;
    
    this.keyPrefix = keyPrefix;
    
    // Initialize memory cache
    const cacheOptions: CacheOptions = {
      maxSize: cacheConfig.maxSize,
      defaultTTL: cacheConfig.ttl,
      onEvict: (key, entry) => {
        // Optionally persist evicted entries to storage
        this.persistToStorage(key, entry.value);
      }
    };
    
    this.memoryCache = new LRUCache<CachedFlag>(cacheOptions);
    
    // Initialize storage adapter
    try {
      this.storageAdapter = createStorageAdapter(storageType);
    } catch (error) {
      console.warn('Failed to create storage adapter, falling back to memory:', error);
      this.storageAdapter = createStorageAdapter('memory');
    }
  }

  /**
   * Get a flag from cache (memory first, then storage)
   */
  async getFlag(key: string): Promise<CachedFlag | null> {
    // Try memory cache first - LRUCache handles TTL internally
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult) {
      return memoryResult;
    }

    // Try persistent storage
    try {
      const storageKey = this.getStorageKey(key);
      const stored = await this.storageAdapter.get(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        const flag: CachedFlag = parsed.flag;
        const timestamp = parsed.timestamp;
        const ttl = parsed.ttl;
        
        // Check if still valid
        const age = Date.now() - timestamp;
        if (age < ttl) {
          // Put back in memory cache with remaining TTL
          const remainingTTL = ttl - age;
          this.memoryCache.set(key, flag, remainingTTL);
          return flag;
        } else {
          // Expired, remove from storage
          await this.storageAdapter.delete(storageKey);
        }
      }
    } catch (error) {
      console.warn(`Failed to read flag ${key} from storage:`, error);
    }

    return null;
  }

  /**
   * Set a flag in cache (both memory and storage)
   */
  async setFlag(key: string, flag: CachedFlag, ttl?: number): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, flag, ttl);
    
    // Persist to storage
    await this.persistToStorage(key, flag, ttl);
  }

  /**
   * Set multiple flags at once
   */
  async setFlags(flags: Record<string, CachedFlag>, ttl?: number): Promise<void> {
    const promises = Object.entries(flags).map(([key, flag]) => 
      this.setFlag(key, flag, ttl)
    );
    
    await Promise.all(promises);
  }

  /**
   * Delete a flag from cache
   */
  async deleteFlag(key: string): Promise<void> {
    // Remove from memory
    this.memoryCache.delete(key);
    
    // Remove from storage
    try {
      await this.storageAdapter.delete(this.getStorageKey(key));
    } catch (error) {
      console.warn(`Failed to delete flag ${key} from storage:`, error);
    }
  }

  /**
   * Clear all flags from cache
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear storage
    try {
      const keys = await this.storageAdapter.keys();
      const flagKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      
      await Promise.all(
        flagKeys.map(key => this.storageAdapter.delete(key))
      );
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * Get all cached flag keys
   */
  async getAllKeys(): Promise<string[]> {
    const memoryKeys = this.memoryCache.keys();
    
    try {
      const storageKeys = await this.storageAdapter.keys();
      const flagKeys = storageKeys
        .filter(key => key.startsWith(this.keyPrefix))
        .map(key => key.substring(this.keyPrefix.length));
      
      // Combine and deduplicate
      const allKeys = new Set([...memoryKeys, ...flagKeys]);
      return Array.from(allKeys);
    } catch (error) {
      console.warn('Failed to get storage keys:', error);
      return memoryKeys;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memory: ReturnType<LRUCache['getStats']>;
    storage: {
      available: boolean;
      type: string;
    };
  } {
    return {
      memory: this.memoryCache.getStats(),
      storage: {
        available: this.storageAdapter.constructor.name !== 'MemoryStorageAdapter',
        type: this.storageAdapter.constructor.name
      }
    };
  }

  /**
   * Enable background refresh of cached flags
   */
  enableBackgroundRefresh(refreshCallback: () => Promise<void>, intervalMs = 60000): void {
    this.backgroundRefreshEnabled = true;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      try {
        await refreshCallback();
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }, intervalMs);
    
    // Don't keep the process alive just for refresh
    if (this.refreshInterval.unref) {
      this.refreshInterval.unref();
    }
  }

  /**
   * Disable background refresh
   */
  disableBackgroundRefresh(): void {
    this.backgroundRefreshEnabled = false;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  /**
   * Invalidate cache entries that match a pattern
   */
  async invalidatePattern(pattern: RegExp): Promise<number> {
    const keys = await this.getAllKeys();
    const matchingKeys = keys.filter(key => pattern.test(key));
    
    await Promise.all(
      matchingKeys.map(key => this.deleteFlag(key))
    );
    
    return matchingKeys.length;
  }

  /**
   * Warm up cache with flags
   */
  async warmUp(flags: Record<string, CachedFlag>, ttl?: number): Promise<void> {
    console.log(`Warming up cache with ${Object.keys(flags).length} flags`);
    await this.setFlags(flags, ttl);
  }

  /**
   * Cleanup expired entries and optimize cache
   */
  async cleanup(): Promise<{ memoryCleanup: number; storageCleanup: number }> {
    // Cleanup memory cache
    const memoryCleanup = this.memoryCache.cleanup();
    
    // Cleanup storage
    let storageCleanup = 0;
    try {
      const keys = await this.storageAdapter.keys();
      const flagKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      
      for (const storageKey of flagKeys) {
        try {
          const stored = await this.storageAdapter.get(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const timestamp = parsed.timestamp;
            const ttl = parsed.ttl;
            
            const age = Date.now() - timestamp;
            if (age >= ttl) {
              await this.storageAdapter.delete(storageKey);
              storageCleanup++;
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          await this.storageAdapter.delete(storageKey);
          storageCleanup++;
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup storage:', error);
    }
    
    return { memoryCleanup, storageCleanup };
  }

  /**
   * Destroy cache and cleanup resources
   */
  async destroy(): Promise<void> {
    this.disableBackgroundRefresh();
    this.memoryCache.destroy();
    await this.clear();
  }

  private async persistToStorage(key: string, flag: CachedFlag, ttl?: number): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      const data = {
        flag,
        timestamp: Date.now(),
        ttl: ttl ?? this.memoryCache['options'].defaultTTL
      };
      
      await this.storageAdapter.set(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to persist flag ${key} to storage:`, error);
    }
  }

  private getStorageKey(key: string): string {
    return this.keyPrefix + key;
  }
}
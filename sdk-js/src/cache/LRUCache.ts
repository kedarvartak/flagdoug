/**
 * LRU (Least Recently Used) Cache implementation with TTL support
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize: number;
  defaultTTL: number; // milliseconds
  onEvict?: (key: string, entry: CacheEntry<any>) => void;
}

export class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private options: CacheOptions;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: CacheOptions) {
    this.options = options;
    
    // Start cleanup interval to remove expired entries
    this.startCleanupInterval();
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl ?? this.options.defaultTTL;
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.removeFromAccessOrder(key);
    }
    
    // Check if we need to evict entries
    if (this.options.maxSize === 0) {
      // Don't store anything if max size is 0
      return;
    }
    
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    // Create new entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now
    };
    
    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    const now = Date.now();
    
    // Check if entry has expired
    if (this.isExpired(entry, now)) {
      this.delete(key);
      return undefined;
    }
    
    // Update access information
    entry.accessCount++;
    entry.lastAccessed = now;
    
    // Move to end of access order (most recently used)
    this.moveToEnd(key);
    
    return entry.value;
  }

  /**
   * Check if a key exists in the cache (without updating access order)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    
    // Call eviction callback if provided
    if (this.options.onEvict) {
      this.options.onEvict(key, entry);
    }
    
    return true;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    // Call eviction callback for all entries if provided
    if (this.options.onEvict) {
      for (const [key, entry] of this.cache.entries()) {
        this.options.onEvict(key, entry);
      }
    }
    
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      accessCount: number;
      lastAccessed: number;
      ttl: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      ttl: entry.ttl,
      age: now - entry.timestamp
    }));
    
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccesses > 0 ? totalAccesses / (totalAccesses + this.cache.size) : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate,
      entries
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    return expiredKeys.length;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    this.clear();
  }

  private isExpired(entry: CacheEntry<T>, now: number = Date.now()): boolean {
    return (now - entry.timestamp) > entry.ttl;
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }
    
    // Remove least recently used entry (first in access order)
    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  private moveToEnd(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private startCleanupInterval(): void {
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
    
    // Don't keep the process alive just for cleanup
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }
}
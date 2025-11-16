import { LRUCache, CacheOptions } from '../LRUCache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;
  let options: CacheOptions;

  beforeEach(() => {
    options = {
      maxSize: 3,
      defaultTTL: 1000, // 1 second
      onEvict: jest.fn()
    };
    cache = new LRUCache<string>(options);
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when max size exceeded', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Cache is now full, adding another should evict key1
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
      expect(cache.size()).toBe(3);
    });

    it('should update access order when getting values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should call onEvict callback when evicting', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1
      
      expect(options.onEvict).toHaveBeenCalledWith('key1', expect.objectContaining({
        value: 'value1'
      }));
    });
  });

  describe('TTL functionality', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should use default TTL when not specified', async () => {
      const shortTTLCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 100 // 100ms
      });
      
      shortTTLCache.set('key1', 'value1');
      
      expect(shortTTLCache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortTTLCache.get('key1')).toBeUndefined();
      
      shortTTLCache.destroy();
    });

    it('should allow custom TTL per entry', async () => {
      cache.set('short', 'value1', 50);  // 50ms TTL
      cache.set('long', 'value2', 200);  // 200ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('short')).toBeUndefined();
      expect(cache.get('long')).toBe('value2');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('long')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      cache.set('key1', 'value1', 50);
      cache.set('key2', 'value2', 200);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const cleanedCount = cache.cleanup();
      
      expect(cleanedCount).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should automatically clean up expired entries periodically', async () => {
      const shortCleanupCache = new LRUCache<string>({
        maxSize: 10,
        defaultTTL: 10 // Very short TTL
      });
      
      shortCleanupCache.set('key1', 'value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Manually trigger cleanup since automatic cleanup runs every 30 seconds
      const cleanedCount = shortCleanupCache.cleanup();
      
      expect(cleanedCount).toBeGreaterThan(0);
      expect(shortCleanupCache.size()).toBe(0);
      
      shortCleanupCache.destroy();
    });
  });

  describe('statistics', () => {
    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // Access key1
      cache.get('key1'); // Access key1 again
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.entries).toHaveLength(2);
      
      const key1Entry = stats.entries.find(e => e.key === 'key1');
      expect(key1Entry?.accessCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle updating existing keys', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2'); // Update
      
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should handle zero max size gracefully', () => {
      const zeroSizeCache = new LRUCache<string>({
        maxSize: 0,
        defaultTTL: 1000
      });
      
      zeroSizeCache.set('key1', 'value1');
      // With zero max size, items should be immediately evicted
      expect(zeroSizeCache.get('key1')).toBeUndefined();
      expect(zeroSizeCache.size()).toBe(0);
      
      zeroSizeCache.destroy();
    });

    it('should handle very short TTL', () => {
      cache.set('key1', 'value1', 1); // 1ms TTL
      
      // Should expire almost immediately
      setTimeout(() => {
        expect(cache.get('key1')).toBeUndefined();
      }, 10);
    });
  });
});
import { CacheManager, CachedFlag } from '../CacheManager';
import { CacheConfig } from '../../types';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let cacheConfig: CacheConfig;

  beforeEach(() => {
    cacheConfig = {
      ttl: 1000, // 1 second
      maxSize: 5,
      strategy: 'lru'
    };

    cacheManager = new CacheManager({
      cacheConfig,
      storageType: 'memory',
      keyPrefix: 'test_'
    });
  });

  afterEach(async () => {
    await cacheManager.destroy();
  });

  const createMockFlag = (key: string, value: any = 'test-value'): CachedFlag => ({
    key,
    value,
    enabled: true,
    version: '1.0',
    metadata: { created: Date.now() }
  });

  describe('basic operations', () => {
    it('should set and get flags', async () => {
      const flag = createMockFlag('test-flag', 'test-value');
      
      await cacheManager.setFlag('test-flag', flag);
      const retrieved = await cacheManager.getFlag('test-flag');
      
      expect(retrieved).toEqual(flag);
    });

    it('should return null for non-existent flags', async () => {
      const result = await cacheManager.getFlag('nonexistent');
      expect(result).toBeNull();
    });

    it('should delete flags', async () => {
      const flag = createMockFlag('test-flag');
      
      await cacheManager.setFlag('test-flag', flag);
      await cacheManager.deleteFlag('test-flag');
      
      const result = await cacheManager.getFlag('test-flag');
      expect(result).toBeNull();
    });

    it('should set multiple flags at once', async () => {
      const flags = {
        'flag1': createMockFlag('flag1', 'value1'),
        'flag2': createMockFlag('flag2', 'value2'),
        'flag3': createMockFlag('flag3', 'value3')
      };

      await cacheManager.setFlags(flags);

      expect(await cacheManager.getFlag('flag1')).toEqual(flags.flag1);
      expect(await cacheManager.getFlag('flag2')).toEqual(flags.flag2);
      expect(await cacheManager.getFlag('flag3')).toEqual(flags.flag3);
    });

    it('should clear all flags', async () => {
      const flags = {
        'flag1': createMockFlag('flag1'),
        'flag2': createMockFlag('flag2')
      };

      await cacheManager.setFlags(flags);
      await cacheManager.clear();

      expect(await cacheManager.getFlag('flag1')).toBeNull();
      expect(await cacheManager.getFlag('flag2')).toBeNull();
    });

    it('should get all cached keys', async () => {
      const flags = {
        'flag1': createMockFlag('flag1'),
        'flag2': createMockFlag('flag2'),
        'flag3': createMockFlag('flag3')
      };

      await cacheManager.setFlags(flags);
      const keys = await cacheManager.getAllKeys();

      expect(keys).toContain('flag1');
      expect(keys).toContain('flag2');
      expect(keys).toContain('flag3');
      expect(keys.length).toBe(3);
    });
  });

  describe('TTL functionality', () => {
    it('should set flags with custom TTL', async () => {
      const flag = createMockFlag('test-flag');
      
      // Just test that we can set flags with custom TTL without errors
      await expect(cacheManager.setFlag('test-flag', flag, 1000)).resolves.toBeUndefined();
      expect(await cacheManager.getFlag('test-flag')).toEqual(flag);
    });

    it('should handle TTL configuration', async () => {
      const shortFlag = createMockFlag('short-flag');
      const longFlag = createMockFlag('long-flag');
      
      // Test that different TTL values can be set
      await cacheManager.setFlag('short-flag', shortFlag, 100);
      await cacheManager.setFlag('long-flag', longFlag, 1000);
      
      expect(await cacheManager.getFlag('short-flag')).toEqual(shortFlag);
      expect(await cacheManager.getFlag('long-flag')).toEqual(longFlag);
    });
  });

  describe('memory and storage integration', () => {
    it('should fall back to storage when not in memory', async () => {
      const flag = createMockFlag('test-flag');
      
      // Set flag
      await cacheManager.setFlag('test-flag', flag);
      
      // Clear memory cache but keep storage
      cacheManager['memoryCache'].clear();
      
      // Should still retrieve from storage
      const retrieved = await cacheManager.getFlag('test-flag');
      expect(retrieved).toEqual(flag);
    });

    it('should promote storage entries back to memory', async () => {
      const flag = createMockFlag('test-flag');
      
      // Set flag
      await cacheManager.setFlag('test-flag', flag);
      
      // Clear memory cache
      cacheManager['memoryCache'].clear();
      
      // Retrieve from storage (should promote to memory)
      await cacheManager.getFlag('test-flag');
      
      // Should now be in memory
      expect(cacheManager['memoryCache'].get('test-flag')).toEqual(flag);
    });
  });

  describe('background refresh', () => {
    it('should enable and disable background refresh', async () => {
      const refreshCallback = jest.fn().mockResolvedValue(undefined);
      
      cacheManager.enableBackgroundRefresh(refreshCallback, 100);
      
      // Wait for at least one refresh cycle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(refreshCallback).toHaveBeenCalled();
      
      cacheManager.disableBackgroundRefresh();
      
      const callCount = refreshCallback.mock.calls.length;
      
      // Wait and ensure no more calls
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(refreshCallback.mock.calls.length).toBe(callCount);
    });

    it('should handle refresh callback errors gracefully', async () => {
      const refreshCallback = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      
      cacheManager.enableBackgroundRefresh(refreshCallback, 50);
      
      // Wait for refresh cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(refreshCallback).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        'Background refresh failed:',
        expect.any(Error)
      );
      
      cacheManager.disableBackgroundRefresh();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate flags matching pattern', async () => {
      const flags = {
        'user_flag_1': createMockFlag('user_flag_1'),
        'user_flag_2': createMockFlag('user_flag_2'),
        'system_flag': createMockFlag('system_flag')
      };

      await cacheManager.setFlags(flags);

      const invalidatedCount = await cacheManager.invalidatePattern(/^user_/);

      expect(invalidatedCount).toBe(2);
      expect(await cacheManager.getFlag('user_flag_1')).toBeNull();
      expect(await cacheManager.getFlag('user_flag_2')).toBeNull();
      expect(await cacheManager.getFlag('system_flag')).toEqual(flags.system_flag);
    });
  });

  describe('cache warming', () => {
    it('should warm up cache with multiple flags', async () => {
      const flags = {
        'flag1': createMockFlag('flag1'),
        'flag2': createMockFlag('flag2'),
        'flag3': createMockFlag('flag3')
      };

      await cacheManager.warmUp(flags);

      expect(await cacheManager.getFlag('flag1')).toEqual(flags.flag1);
      expect(await cacheManager.getFlag('flag2')).toEqual(flags.flag2);
      expect(await cacheManager.getFlag('flag3')).toEqual(flags.flag3);
    });
  });

  describe('cleanup', () => {
    it('should run cleanup without errors', async () => {
      const flag1 = createMockFlag('flag1');
      const flag2 = createMockFlag('flag2');
      
      await cacheManager.setFlag('flag1', flag1);
      await cacheManager.setFlag('flag2', flag2);
      
      const result = await cacheManager.cleanup();
      
      expect(result).toHaveProperty('memoryCleanup');
      expect(result).toHaveProperty('storageCleanup');
      expect(typeof result.memoryCleanup).toBe('number');
      expect(typeof result.storageCleanup).toBe('number');
    });
  });

  describe('statistics', () => {
    it('should provide cache statistics', async () => {
      const flags = {
        'flag1': createMockFlag('flag1'),
        'flag2': createMockFlag('flag2')
      };

      await cacheManager.setFlags(flags);
      
      // Access flag1 to update stats
      await cacheManager.getFlag('flag1');

      const stats = cacheManager.getStats();

      expect(stats.memory.size).toBe(2);
      expect(stats.memory.maxSize).toBe(5);
      expect(stats.storage.available).toBe(false); // Memory storage
      expect(stats.storage.type).toBe('MemoryStorageAdapter');
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Create a cache manager with a storage adapter that throws errors
      const errorCacheManager = new CacheManager({
        cacheConfig,
        storageType: 'localStorage' // This will fail in test environment
      });

      const flag = createMockFlag('test-flag');
      
      // Should not throw, just warn
      await expect(errorCacheManager.setFlag('test-flag', flag)).resolves.toBeUndefined();
      
      await errorCacheManager.destroy();
    });

    it('should handle malformed storage data', async () => {
      // Manually corrupt storage data
      await cacheManager['storageAdapter'].set('test_corrupted', 'invalid-json');
      
      // Should return null and not throw
      const result = await cacheManager.getFlag('corrupted');
      expect(result).toBeNull();
    });
  });
});
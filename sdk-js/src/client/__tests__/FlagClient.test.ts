import { FlagClient } from '../FlagClient';
import { FlagError, FlagErrorType } from '../../errors';
import { ClientConfig } from '../../types';

describe('FlagClient', () => {
  let client: FlagClient;
  let config: ClientConfig;

  beforeEach(() => {
    config = createMockClientConfig();
    client = new FlagClient(config);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('constructor', () => {
    it('should create a client with valid config', () => {
      expect(client).toBeInstanceOf(FlagClient);
    });

    it('should throw error for missing API key', () => {
      expect(() => {
        new FlagClient({ ...config, apiKey: '' });
      }).toThrow(FlagError);
    });

    it('should throw error for short API key', () => {
      expect(() => {
        new FlagClient({ ...config, apiKey: 'short' });
      }).toThrow(FlagError);
    });

    it('should throw error for non-string API key', () => {
      expect(() => {
        new FlagClient({ ...config, apiKey: 123 as any });
      }).toThrow(FlagError);
    });

    it('should throw error for invalid base URL', () => {
      expect(() => {
        new FlagClient({ ...config, baseUrl: 'not-a-url' });
      }).toThrow(FlagError);
    });

    it('should throw error for invalid cache TTL', () => {
      expect(() => {
        new FlagClient({
          ...config,
          cacheConfig: { ttl: 0, maxSize: 100, strategy: 'lru' }
        });
      }).toThrow(FlagError);
    });

    it('should throw error for invalid cache max size', () => {
      expect(() => {
        new FlagClient({
          ...config,
          cacheConfig: { ttl: 1000, maxSize: 0, strategy: 'lru' }
        });
      }).toThrow(FlagError);
    });

    it('should throw error for invalid reconnect interval', () => {
      expect(() => {
        new FlagClient({
          ...config,
          realTimeConfig: {
            enabled: true,
            transport: 'websocket',
            reconnectInterval: 50,
            maxReconnectAttempts: 3
          }
        });
      }).toThrow(FlagError);
    });

    it('should throw error for negative max reconnect attempts', () => {
      expect(() => {
        new FlagClient({
          ...config,
          realTimeConfig: {
            enabled: true,
            transport: 'websocket',
            reconnectInterval: 1000,
            maxReconnectAttempts: -1
          }
        });
      }).toThrow(FlagError);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const readyHandler = jest.fn();
      client.on('ready', readyHandler);

      await client.initialize();

      expect(readyHandler).toHaveBeenCalledWith('ready', undefined);
      expect(client.isInitialized()).toBe(true);
      
      // Verify API key validation was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/validate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${config.apiKey}`
          })
        })
      );
      
      // Verify flags were fetched
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/flags'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${config.apiKey}`
          })
        })
      );
    });

    it('should not initialize twice', async () => {
      await client.initialize();
      
      const fetchCallCount = (fetch as jest.Mock).mock.calls.length;
      
      // Second initialization should not make additional API calls
      await expect(client.initialize()).resolves.toBeUndefined();
      expect((fetch as jest.Mock).mock.calls.length).toBe(fetchCallCount);
    });

    it('should handle API key validation failure', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid API key' })
        })
      );

      const errorHandler = jest.fn();
      client.on('error', errorHandler);

      await expect(client.initialize()).rejects.toThrow(FlagError);
      expect(errorHandler).toHaveBeenCalledWith('error', expect.any(FlagError));
      expect(client.isInitialized()).toBe(false);
    });

    it('should handle network errors during initialization', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );

      const errorHandler = jest.fn();
      client.on('error', errorHandler);

      await expect(client.initialize()).rejects.toThrow(FlagError);
      expect(errorHandler).toHaveBeenCalledWith('error', expect.any(FlagError));
      expect(client.isInitialized()).toBe(false);
    });

    it('should handle concurrent initialization attempts', async () => {
      const promise1 = client.initialize();
      const promise2 = client.initialize();
      const promise3 = client.initialize();

      await Promise.all([promise1, promise2, promise3]);

      expect(client.isInitialized()).toBe(true);
      // Should only make one set of API calls despite multiple initialize calls
      expect((fetch as jest.Mock).mock.calls.length).toBe(2); // validate + flags
    });
  });

  describe('getFlag', () => {
    it('should return default value when not initialized', () => {
      const result = client.getFlag('test-flag', 'default');
      
      expect(result).toBe('default');
      expect(console.warn).toHaveBeenCalledWith(
        'FlagClient not initialized, returning default value'
      );
    });

    it('should return cached flag value after initialization', async () => {
      await client.initialize();
      
      const result = client.getFlag('test-flag', 'default');
      
      // Should return the cached value from the mock fetch response
      expect(result).toBe('test-value');
    });

    it('should handle different flag value types', async () => {
      await client.initialize();
      
      // Should return cached values from mock fetch response
      expect(client.getFlag('test-flag', 'default')).toBe('test-value');
      expect(client.getFlag('number-flag', 0)).toBe(42);
      expect(client.getFlag('boolean-flag', false)).toBe(true);
      
      // Non-existent flag should return default
      expect(client.getFlag('nonexistent-flag', 'default')).toBe('default');
    });
  });

  describe('getAllFlags', () => {
    it('should return empty object when not initialized', () => {
      const result = client.getAllFlags();
      
      expect(result).toEqual({});
      expect(console.warn).toHaveBeenCalledWith(
        'FlagClient not initialized, returning empty flags'
      );
    });

    it('should return cached flags after initialization', async () => {
      await client.initialize();
      
      const result = client.getAllFlags();
      
      // Should return the cached flags from mock fetch response
      expect(result).toEqual({
        'test-flag': 'test-value',
        'number-flag': 42,
        'boolean-flag': true
      });
    });
  });

  describe('event handling', () => {
    it('should add and remove event listeners', () => {
      const handler = jest.fn();
      
      client.on('ready', handler);
      client.off('ready', handler);
      
      // Handler should not be called after removal
      client['emit']('ready');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      client.on('ready', handler1);
      client.on('ready', handler2);
      
      client['emit']('ready');
      
      expect(handler1).toHaveBeenCalledWith('ready', undefined);
      expect(handler2).toHaveBeenCalledWith('ready', undefined);
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();
      
      client.on('ready', errorHandler);
      client.on('ready', normalHandler);
      
      client['emit']('ready');
      
      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error in event handler for ready:',
        expect.any(Error)
      );
    });
  });

  describe('close', () => {
    it('should close successfully when initialized', async () => {
      await client.initialize();
      expect(client.isInitialized()).toBe(true);
      
      await expect(client.close()).resolves.toBeUndefined();
      expect(client.isInitialized()).toBe(false);
    });

    it('should handle close when not initialized', async () => {
      expect(client.isInitialized()).toBe(false);
      await expect(client.close()).resolves.toBeUndefined();
      expect(client.isInitialized()).toBe(false);
    });

    it('should clear event handlers on close', async () => {
      const handler = jest.fn();
      client.on('ready', handler);
      
      await client.initialize();
      await client.close();
      
      // Try to emit an event - handler should not be called
      client['emit']('ready');
      expect(handler).toHaveBeenCalledTimes(1); // Only from initialization
    });
  });

  describe('context-aware evaluation', () => {
    it('should evaluate flags with user context', async () => {
      await client.initialize();
      
      const userContext = {
        userId: 'user-123',
        attributes: {
          plan: 'premium',
          country: 'US'
        }
      };
      
      const result = client.getFlag('test-flag', 'default', userContext);
      expect(result).toBe('test-value');
    });

    it('should return detailed evaluation results', async () => {
      await client.initialize();
      
      const userContext = {
        userId: 'user-123',
        attributes: {
          plan: 'premium'
        }
      };
      
      const result = client.getFlagWithDetails('test-flag', 'default', userContext);
      
      expect(result.value).toBe('test-value');
      expect(result.reason).toBe('DEFAULT');
      expect(result.ruleId).toBeUndefined();
    });

    it('should handle missing context gracefully', async () => {
      await client.initialize();
      
      const result = client.getFlag('test-flag', 'default');
      expect(result).toBe('test-value');
    });

    it('should evaluate all flags with context', async () => {
      await client.initialize();
      
      const userContext = {
        userId: 'user-123',
        attributes: {
          plan: 'premium'
        }
      };
      
      const results = client.getAllFlags(userContext);
      
      expect(results).toEqual({
        'test-flag': 'test-value',
        'number-flag': 42,
        'boolean-flag': true
      });
    });
  });

  describe('utility methods', () => {
    it('should return initialization status', () => {
      expect(client.isInitialized()).toBe(false);
    });

    it('should return readonly config', () => {
      const returnedConfig = client.getConfig();
      expect(returnedConfig.apiKey).toBe(config.apiKey);
      
      // Should be readonly - modifying shouldn't affect original
      (returnedConfig as any).apiKey = 'modified';
      expect(client.getConfig().apiKey).toBe(config.apiKey);
    });
  });
});
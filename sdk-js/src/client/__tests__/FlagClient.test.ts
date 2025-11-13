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
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const readyHandler = jest.fn();
      client.on('ready', readyHandler);

      await client.initialize();

      expect(readyHandler).toHaveBeenCalledWith('ready', undefined);
    });

    it('should not initialize twice', async () => {
      await client.initialize();
      
      // Second initialization should not throw
      await expect(client.initialize()).resolves.toBeUndefined();
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

    it('should return default value after initialization', async () => {
      await client.initialize();
      
      const result = client.getFlag('test-flag', 'default');
      
      expect(result).toBe('default');
    });

    it('should handle different flag value types', async () => {
      await client.initialize();
      
      expect(client.getFlag('string-flag', 'default')).toBe('default');
      expect(client.getFlag('number-flag', 42)).toBe(42);
      expect(client.getFlag('boolean-flag', true)).toBe(true);
      expect(client.getFlag('object-flag', { key: 'value' })).toEqual({ key: 'value' });
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

    it('should return empty object after initialization', async () => {
      await client.initialize();
      
      const result = client.getAllFlags();
      
      expect(result).toEqual({});
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
      await expect(client.close()).resolves.toBeUndefined();
    });

    it('should handle close when not initialized', async () => {
      await expect(client.close()).resolves.toBeUndefined();
    });
  });
});
import { ClientConfig, UserContext, ClientEvent, ClientEventHandler, FlagValue } from '../types';
import { FlagError, FlagErrorType } from '../errors';
import { CacheManager, CachedFlag } from '../cache';
import { EvaluationEngine, EvaluationContext } from '../evaluation';

/**
 * Main client for browser/client-side flag evaluation
 */
export class FlagClient {
  private config: ClientConfig;
  private initialized = false;
  private initializing = false;
  private eventHandlers = new Map<ClientEvent, Set<ClientEventHandler>>();
  private cacheManager?: CacheManager;
  private evaluationEngine: EvaluationEngine;
  private lastFetchTime = 0;

  constructor(config: ClientConfig) {
    this.config = this.mergeWithDefaults(config);
    this.validateConfig();
    this.evaluationEngine = new EvaluationEngine();
  }

  /**
   * Initialize the client and fetch initial flag values
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializing) {
      // Wait for ongoing initialization
      return new Promise((resolve, reject) => {
        const checkInitialized = () => {
          if (this.initialized) {
            resolve();
          } else if (!this.initializing) {
            reject(new FlagError(FlagErrorType.CONFIGURATION_ERROR, 'Initialization failed'));
          } else {
            setTimeout(checkInitialized, 10);
          }
        };
        checkInitialized();
      });
    }

    this.initializing = true;

    try {
      // Initialize cache manager
      this.initializeCacheManager();
      
      // Validate API key with server
      await this.validateApiKey();
      
      // Fetch initial flags
      await this.fetchFlags();
      
      // Set up real-time connection if enabled
      if (this.config.realTimeConfig?.enabled) {
        await this.setupRealTimeConnection();
      }
      
      // Enable background refresh if configured
      if (this.cacheManager) {
        this.cacheManager.enableBackgroundRefresh(
          () => this.refreshFlags(),
          60000 // Refresh every minute
        );
      }
      
      this.initialized = true;
      this.initializing = false;
      this.emit('ready');
    } catch (error) {
      this.initializing = false;
      const flagError = new FlagError(
        FlagErrorType.CONFIGURATION_ERROR,
        'Failed to initialize client',
        { cause: error as Error, retryable: true }
      );
      this.emit('error', flagError);
      throw flagError;
    }
  }

  /**
   * Get a flag value with optional user context
   */
  getFlag<T extends FlagValue>(
    key: string,
    defaultValue: T,
    context?: UserContext
  ): T {
    if (!this.initialized) {
      console.warn('FlagClient not initialized, returning default value');
      return defaultValue;
    }

    try {
      // Get flag from cache (synchronous for client-side)
      const cachedFlag = this.getFlagFromCacheSync(key);
      
      if (!cachedFlag) {
        return defaultValue;
      }

      // Create evaluation context
      const evaluationContext: EvaluationContext = {
        userId: context?.userId,
        attributes: context?.attributes || {},
        environment: context?.environment || this.config.environment || 'production',
        timestamp: context?.timestamp || Date.now(),
        flagKey: key,
        defaultValue
      };

      // Evaluate flag with context
      const result = this.evaluationEngine.evaluate(cachedFlag, evaluationContext, defaultValue);
      
      return result.value;
    } catch (error) {
      console.error(`Error evaluating flag ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get all flags for the given context
   */
  getAllFlags(context?: UserContext): Record<string, FlagValue> {
    if (!this.initialized) {
      console.warn('FlagClient not initialized, returning empty flags');
      return {};
    }

    try {
      // Get all flags from cache
      const allFlags: Record<string, FlagValue> = {};
      
      if (this.cacheManager) {
        const keys = this.cacheManager['memoryCache'].keys();
        
        keys.forEach(key => {
          const cachedFlag = this.getFlagFromCacheSync(key);
          if (cachedFlag) {
            // Create evaluation context for each flag
            const evaluationContext: EvaluationContext = {
              userId: context?.userId,
              attributes: context?.attributes || {},
              environment: context?.environment || this.config.environment || 'production',
              timestamp: context?.timestamp || Date.now(),
              flagKey: key,
              defaultValue: null
            };

            // Evaluate flag with context
            const result = this.evaluationEngine.evaluate(cachedFlag, evaluationContext, null);
            
            // Only include enabled flags with non-null values
            if (result.value !== null) {
              allFlags[key] = result.value;
            }
          }
        });
      }
      
      return allFlags;
    } catch (error) {
      console.error('Error getting all flags:', error);
      return {};
    }
  }

  /**
   * Add event listener
   */
  on(event: ClientEvent, handler: ClientEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  off(event: ClientEvent, handler: ClientEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Close the client and clean up resources
   */
  async close(): Promise<void> {
    if (!this.initialized && !this.initializing) {
      return;
    }

    try {
      // Close real-time connections
      await this.closeRealTimeConnection();
      
      // Destroy cache manager
      if (this.cacheManager) {
        await this.cacheManager.destroy();
        this.cacheManager = undefined;
      }
      
      this.lastFetchTime = 0;
      
      // Clear event listeners
      this.eventHandlers.clear();
      
      this.initialized = false;
      this.initializing = false;
    } catch (error) {
      console.error('Error closing client:', error);
    }
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<ClientConfig> {
    return { ...this.config };
  }

  /**
   * Get a flag value with detailed evaluation result
   */
  getFlagWithDetails<T extends FlagValue>(
    key: string,
    defaultValue: T,
    context?: UserContext
  ): import('../types').EvaluationResult<T> {
    if (!this.initialized) {
      console.warn('FlagClient not initialized, returning default value');
      return {
        value: defaultValue,
        reason: 'ERROR'
      };
    }

    try {
      const cachedFlag = this.getFlagFromCacheSync(key);
      
      if (!cachedFlag) {
        return {
          value: defaultValue,
          reason: 'DEFAULT'
        };
      }

      const evaluationContext: EvaluationContext = {
        userId: context?.userId,
        attributes: context?.attributes || {},
        environment: context?.environment || this.config.environment || 'production',
        timestamp: context?.timestamp || Date.now(),
        flagKey: key,
        defaultValue
      };

      return this.evaluationEngine.evaluate(cachedFlag, evaluationContext, defaultValue);
    } catch (error) {
      console.error(`Error evaluating flag ${key} with details:`, error);
      return {
        value: defaultValue,
        reason: 'ERROR'
      };
    }
  }

  private mergeWithDefaults(config: ClientConfig): ClientConfig {
    return {
      baseUrl: 'https://api.flagservice.com',
      environment: 'production',
      cacheConfig: {
        ttl: 30000, // 30 seconds
        maxSize: 1000,
        strategy: 'lru'
      },
      realTimeConfig: {
        enabled: true,
        transport: 'websocket',
        reconnectInterval: 1000,
        maxReconnectAttempts: 5
      },
      offlineConfig: {
        enabled: true,
        storage: 'localStorage'
      },
      ...config
    };
  }

  private validateConfig(): void {
    if (!this.config.apiKey || typeof this.config.apiKey !== 'string') {
      throw new FlagError(
        FlagErrorType.CONFIGURATION_ERROR,
        'API key is required and must be a string'
      );
    }

    if (this.config.apiKey.length < 10) {
      throw new FlagError(
        FlagErrorType.CONFIGURATION_ERROR,
        'API key appears to be invalid (too short)'
      );
    }

    if (this.config.baseUrl && !this.isValidUrl(this.config.baseUrl)) {
      throw new FlagError(
        FlagErrorType.CONFIGURATION_ERROR,
        'Base URL must be a valid URL'
      );
    }

    if (this.config.cacheConfig) {
      const { ttl, maxSize } = this.config.cacheConfig;
      if (ttl <= 0) {
        throw new FlagError(
          FlagErrorType.CONFIGURATION_ERROR,
          'Cache TTL must be greater than 0'
        );
      }
      if (maxSize <= 0) {
        throw new FlagError(
          FlagErrorType.CONFIGURATION_ERROR,
          'Cache max size must be greater than 0'
        );
      }
    }

    if (this.config.realTimeConfig) {
      const { reconnectInterval, maxReconnectAttempts } = this.config.realTimeConfig;
      if (reconnectInterval < 100) {
        throw new FlagError(
          FlagErrorType.CONFIGURATION_ERROR,
          'Reconnect interval must be at least 100ms'
        );
      }
      if (maxReconnectAttempts < 0) {
        throw new FlagError(
          FlagErrorType.CONFIGURATION_ERROR,
          'Max reconnect attempts must be non-negative'
        );
      }
    }
  }

  private async validateApiKey(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          environment: this.config.environment
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new FlagError(
            FlagErrorType.AUTHENTICATION_ERROR,
            'Invalid API key'
          );
        } else if (response.status === 403) {
          throw new FlagError(
            FlagErrorType.AUTHENTICATION_ERROR,
            'API key does not have permission for this environment'
          );
        } else {
          throw new FlagError(
            FlagErrorType.NETWORK_ERROR,
            `API validation failed with status ${response.status}`,
            { retryable: true }
          );
        }
      }

      const data = await response.json();
      if (!data.valid) {
        throw new FlagError(
          FlagErrorType.AUTHENTICATION_ERROR,
          'API key validation failed'
        );
      }
    } catch (error) {
      if (error instanceof FlagError) {
        throw error;
      }
      
      // Network or other errors
      throw new FlagError(
        FlagErrorType.NETWORK_ERROR,
        'Failed to validate API key',
        { cause: error as Error, retryable: true }
      );
    }
  }

  private async fetchFlags(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/flags`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new FlagError(
          FlagErrorType.NETWORK_ERROR,
          `Failed to fetch flags: ${response.status}`,
          { retryable: true }
        );
      }

      const data = await response.json();
      
      // Store flags in cache
      if (this.cacheManager && data.flags && Array.isArray(data.flags)) {
        const flagsToCache: Record<string, CachedFlag> = {};
        
        data.flags.forEach((flag: any) => {
          const cachedFlag: CachedFlag = {
            key: flag.key,
            value: flag.value,
            enabled: flag.enabled ?? true,
            version: flag.version,
            targeting: flag.targeting,
            metadata: flag.metadata
          };
          
          flagsToCache[flag.key] = cachedFlag;
        });
        
        await this.cacheManager.setFlags(flagsToCache);
      }

      this.lastFetchTime = Date.now();
    } catch (error) {
      if (error instanceof FlagError) {
        throw error;
      }
      
      throw new FlagError(
        FlagErrorType.NETWORK_ERROR,
        'Failed to fetch flags',
        { cause: error as Error, retryable: true }
      );
    }
  }

  private async refreshFlags(): Promise<void> {
    try {
      await this.fetchFlags();
      this.emit('flagsChanged');
    } catch (error) {
      console.warn('Background flag refresh failed:', error);
    }
  }

  private initializeCacheManager(): void {
    if (!this.config.cacheConfig) {
      return;
    }

    this.cacheManager = new CacheManager({
      cacheConfig: this.config.cacheConfig,
      storageType: this.config.offlineConfig?.storage || 'memory',
      keyPrefix: `flags_${this.config.environment}_`
    });
  }

  private getFlagFromCacheSync(key: string): CachedFlag | null {
    if (!this.cacheManager) {
      return null;
    }

    // Use the memory cache directly for synchronous access
    return this.cacheManager['memoryCache'].get(key) || null;
  }

  private async setupRealTimeConnection(): Promise<void> {
    // TODO: Implement WebSocket/SSE connection for real-time updates
    // This will be implemented in task 3 (real-time updates infrastructure)
    console.log('Real-time connection setup - to be implemented in task 3');
  }

  private async closeRealTimeConnection(): Promise<void> {
    // TODO: Close WebSocket/SSE connection
    // This will be implemented in task 3 (real-time updates infrastructure)
    console.log('Real-time connection cleanup - to be implemented in task 3');
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private emit(event: ClientEvent, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event, data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}
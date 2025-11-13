import { ClientConfig, UserContext, ClientEvent, ClientEventHandler, FlagValue } from '../types';
import { FlagError, FlagErrorType } from '../errors';

/**
 * Main client for browser/client-side flag evaluation
 */
export class FlagClient {
  private config: ClientConfig;
  private initialized = false;
  private eventHandlers = new Map<ClientEvent, Set<ClientEventHandler>>();

  constructor(config: ClientConfig) {
    this.config = { ...config };
    this.validateConfig();
  }

  /**
   * Initialize the client and fetch initial flag values
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // TODO: Implement initialization logic
      // - Validate API key
      // - Fetch initial flags
      // - Set up caching
      // - Establish real-time connection if enabled
      
      this.initialized = true;
      this.emit('ready');
    } catch (error) {
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
    _context?: UserContext
  ): T {
    if (!this.initialized) {
      console.warn('FlagClient not initialized, returning default value');
      return defaultValue;
    }

    try {
      // TODO: Implement flag evaluation logic
      // - Check local cache first
      // - Evaluate targeting rules
      // - Return cached or default value
      
      return defaultValue;
    } catch (error) {
      console.error(`Error evaluating flag ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get all flags for the given context
   */
  getAllFlags(_context?: UserContext): Record<string, FlagValue> {
    if (!this.initialized) {
      console.warn('FlagClient not initialized, returning empty flags');
      return {};
    }

    try {
      // TODO: Implement bulk flag evaluation
      // For now, return empty object
    } catch (error) {
      console.error('Error getting all flags:', error);
    }
    
    return {};
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
    if (!this.initialized) {
      return;
    }

    try {
      // TODO: Implement cleanup logic
      // - Close WebSocket connections
      // - Clear caches
      // - Remove event listeners
      
      this.initialized = false;
      this.eventHandlers.clear();
    } catch (error) {
      console.error('Error closing client:', error);
    }
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new FlagError(
        FlagErrorType.CONFIGURATION_ERROR,
        'API key is required'
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
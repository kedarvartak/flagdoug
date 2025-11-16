/**
 * Storage adapter interface for persistent caching
 */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

/**
 * Memory storage adapter (non-persistent)
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

/**
 * LocalStorage adapter for browser environments
 */
export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'flagclient_') {
    this.prefix = prefix;
    
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available in this environment');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
      // Don't throw - gracefully degrade to memory-only
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      keys.forEach(key => localStorage.removeItem(this.prefix + key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.warn('Failed to get keys from localStorage:', error);
      return [];
    }
  }
}

/**
 * SessionStorage adapter for browser environments
 */
export class SessionStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'flagclient_') {
    this.prefix = prefix;
    
    if (typeof sessionStorage === 'undefined') {
      throw new Error('sessionStorage is not available in this environment');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return sessionStorage.getItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      sessionStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.warn('Failed to write to sessionStorage:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to delete from sessionStorage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      keys.forEach(key => sessionStorage.removeItem(this.prefix + key));
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.warn('Failed to get keys from sessionStorage:', error);
      return [];
    }
  }
}

/**
 * Create storage adapter based on type and environment
 */
export function createStorageAdapter(type: 'memory' | 'localStorage' | 'sessionStorage'): StorageAdapter {
  switch (type) {
    case 'memory':
      return new MemoryStorageAdapter();
    case 'localStorage':
      return new LocalStorageAdapter();
    case 'sessionStorage':
      return new SessionStorageAdapter();
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}
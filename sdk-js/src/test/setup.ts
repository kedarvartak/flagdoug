// Jest setup file for SDK tests

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Mock fetch globally for tests
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // Reset fetch mock
  mockFetch.mockClear();
  
  // Default successful responses
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/validate')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ valid: true })
      });
    }
    
    if (url.includes('/flags')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          flags: [
            { key: 'test-flag', value: 'test-value', enabled: true },
            { key: 'number-flag', value: 42, enabled: true },
            { key: 'boolean-flag', value: true, enabled: true }
          ]
        })
      });
    }
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({})
    });
  });
});

afterEach(() => {
  // Restore original console methods after each test
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
(global as any).createMockUserContext = (overrides = {}) => ({
  userId: 'test-user-123',
  attributes: {
    email: 'test@example.com',
    plan: 'premium',
    ...overrides
  },
  environment: 'test',
  timestamp: Date.now()
});

(global as any).createMockClientConfig = (overrides = {}) => ({
  apiKey: 'test-api-key-123',
  baseUrl: 'https://api.test.com',
  environment: 'test',
  cacheConfig: {
    ttl: 30000,
    maxSize: 100,
    strategy: 'lru' as const
  },
  realTimeConfig: {
    enabled: false,
    transport: 'websocket' as const,
    reconnectInterval: 1000,
    maxReconnectAttempts: 3
  },
  ...overrides
});

// Global test utilities are declared in globals.d.ts
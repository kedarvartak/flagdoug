// Jest setup file for SDK tests

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn();
  console.warn = jest.fn();
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
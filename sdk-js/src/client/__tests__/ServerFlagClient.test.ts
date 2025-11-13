import { ServerFlagClient } from '../ServerFlagClient';
import { ServerConfig, UserContext } from '../../types';

describe('ServerFlagClient', () => {
  let client: ServerFlagClient;
  let config: ServerConfig;
  let userContext: UserContext;

  beforeEach(() => {
    config = {
      ...createMockClientConfig(),
      bulkEvaluation: true,
      redis: {
        host: 'localhost',
        port: 6379,
        keyPrefix: 'flags:'
      }
    };
    client = new ServerFlagClient(config);
    userContext = createMockUserContext();
  });

  afterEach(async () => {
    await client.close();
  });

  describe('evaluateFlag', () => {
    it('should return default value', async () => {
      const result = await client.evaluateFlag('test-flag', userContext, 'default');
      
      expect(result).toBe('default');
    });

    it('should handle different value types', async () => {
      expect(await client.evaluateFlag('string-flag', userContext, 'test')).toBe('test');
      expect(await client.evaluateFlag('number-flag', userContext, 42)).toBe(42);
      expect(await client.evaluateFlag('boolean-flag', userContext, true)).toBe(true);
      expect(await client.evaluateFlag('object-flag', userContext, { key: 'value' }))
        .toEqual({ key: 'value' });
    });
  });

  describe('evaluateAllFlags', () => {
    it('should return empty object', async () => {
      const result = await client.evaluateAllFlags(userContext);
      
      expect(result).toEqual({});
    });
  });

  describe('evaluateFlagWithDetails', () => {
    it('should return evaluation result with default reason', async () => {
      const result = await client.evaluateFlagWithDetails('test-flag', userContext, 'default');
      
      expect(result).toEqual({
        value: 'default',
        reason: 'DEFAULT'
      });
    });
  });

  describe('middleware', () => {
    it('should create Express middleware function', () => {
      const middleware = client.middleware();
      
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should inject flags into request object', () => {
      const middleware = client.middleware();
      const req = {} as any;
      const res = {} as any;
      const next = jest.fn();
      
      middleware(req, res, next);
      
      expect(req.flags).toEqual({});
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle middleware errors', () => {
      const middleware = client.middleware();
      const req = null; // This will cause an error
      const res = {} as any;
      const next = jest.fn();
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(console.error).toHaveBeenCalledWith(
        'Error in flag middleware:',
        expect.any(Error)
      );
    });
  });
});
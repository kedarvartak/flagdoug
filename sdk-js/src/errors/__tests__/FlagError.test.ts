import { FlagError, FlagErrorType } from '../index';

describe('FlagError', () => {
  it('should create error with basic properties', () => {
    const error = new FlagError(
      FlagErrorType.NETWORK_ERROR,
      'Network connection failed'
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FlagError);
    expect(error.name).toBe('FlagError');
    expect(error.type).toBe(FlagErrorType.NETWORK_ERROR);
    expect(error.message).toBe('Network connection failed');
    expect(error.retryable).toBe(false);
    expect(error.flagKey).toBeUndefined();
    expect(error.context).toBeUndefined();
  });

  it('should create error with all options', () => {
    const context = { userId: 'test-123' };
    const cause = new Error('Original error');
    
    const error = new FlagError(
      FlagErrorType.EVALUATION_ERROR,
      'Flag evaluation failed',
      {
        flagKey: 'test-flag',
        context,
        retryable: true,
        cause
      }
    );

    expect(error.type).toBe(FlagErrorType.EVALUATION_ERROR);
    expect(error.message).toBe('Flag evaluation failed');
    expect(error.flagKey).toBe('test-flag');
    expect(error.context).toBe(context);
    expect(error.retryable).toBe(true);
    expect(error.cause).toBe(cause);
  });

  it('should have proper stack trace', () => {
    const error = new FlagError(
      FlagErrorType.CACHE_ERROR,
      'Cache operation failed'
    );

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('FlagError.test.ts');
  });

  describe('FlagErrorType enum', () => {
    it('should have all expected error types', () => {
      expect(FlagErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(FlagErrorType.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
      expect(FlagErrorType.INVALID_FLAG_KEY).toBe('INVALID_FLAG_KEY');
      expect(FlagErrorType.EVALUATION_ERROR).toBe('EVALUATION_ERROR');
      expect(FlagErrorType.CACHE_ERROR).toBe('CACHE_ERROR');
      expect(FlagErrorType.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
    });
  });
});
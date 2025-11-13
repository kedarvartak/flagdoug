export enum FlagErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_FLAG_KEY = 'INVALID_FLAG_KEY',
  EVALUATION_ERROR = 'EVALUATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export class FlagError extends Error {
  public readonly type: FlagErrorType;
  public readonly flagKey?: string;
  public readonly context?: any;
  public readonly retryable: boolean;

  constructor(
    type: FlagErrorType,
    message: string,
    options: {
      flagKey?: string;
      context?: any;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'FlagError';
    this.type = type;
    this.flagKey = options.flagKey;
    this.context = options.context;
    this.retryable = options.retryable ?? false;

    if (options.cause) {
      (this as any).cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlagError);
    }
  }
}
/**
 * Error Handling Utilities
 * Provides enhanced error handling with retry logic and user-friendly messages
 */

import { ApiError, type ValidationError } from '../types/api.types';

/**
 * Error type classification
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Classify error type based on status code or error instance
 */
export function classifyError(error: unknown): ErrorType {
  if (error instanceof ApiError) {
    const { statusCode } = error;

    if (statusCode === 0) return ErrorType.NETWORK;
    if (statusCode === 408) return ErrorType.TIMEOUT;
    if (statusCode === 400 || statusCode === 422) return ErrorType.VALIDATION;
    if (statusCode === 401) return ErrorType.UNAUTHORIZED;
    if (statusCode === 403) return ErrorType.FORBIDDEN;
    if (statusCode === 404) return ErrorType.NOT_FOUND;
    if (statusCode >= 500) return ErrorType.SERVER;
  }

  if (error instanceof TypeError) {
    return ErrorType.NETWORK;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return ErrorType.TIMEOUT;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return classifyError(error) === ErrorType.NETWORK;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(
  error: unknown,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  // Network and timeout errors are always retryable
  const errorType = classifyError(error);
  if (errorType === ErrorType.NETWORK || errorType === ErrorType.TIMEOUT) {
    return true;
  }

  // Check if status code is in retryable list
  if (error instanceof ApiError) {
    return config.retryableStatuses.includes(error.statusCode);
  }

  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const errorType = classifyError(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';

    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Please try again.';

    case ErrorType.VALIDATION:
      if (error instanceof ApiError && error.message) {
        return error.message;
      }
      return 'Please check your input and try again.';

    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';

    case ErrorType.UNAUTHORIZED:
      return 'You are not authorized to perform this action. Please log in and try again.';

    case ErrorType.FORBIDDEN:
      return 'You do not have permission to perform this action.';

    case ErrorType.SERVER:
      return 'A server error occurred. Please try again later or contact support if the problem persists.';

    case ErrorType.UNKNOWN:
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Map validation errors to form field errors
 */
export function mapValidationErrors(
  error: unknown,
): Record<string, string> | null {
  if (!(error instanceof ApiError) || !error.errors) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};

  error.errors.forEach((validationError: ValidationError) => {
    fieldErrors[validationError.field] = validationError.message;
  });

  return fieldErrors;
}

/**
 * Calculate delay for exponential backoff
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error, retryConfig)) {
        throw error;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt === retryConfig.maxRetries) {
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.warn(
        `Request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). Retrying in ${delay}ms...`,
        error,
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Enhanced error logger
 */
export function logError(error: unknown, context?: string): void {
  const errorType = classifyError(error);
  const message = getUserFriendlyMessage(error);

  const logData = {
    type: errorType,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ApiError) {
    console.error('API Error:', {
      ...logData,
      statusCode: error.statusCode,
      validationErrors: error.errors,
    });
  } else if (error instanceof Error) {
    console.error('Error:', {
      ...logData,
      name: error.name,
      stack: error.stack,
    });
  } else {
    console.error('Unknown Error:', logData);
  }
}

/**
 * Create a detailed error report for debugging
 */
export function createErrorReport(error: unknown): {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  validationErrors?: ValidationError[];
  timestamp: string;
} {
  const errorType = classifyError(error);
  const userMessage = getUserFriendlyMessage(error);

  const report = {
    type: errorType,
    message: error instanceof Error ? error.message : 'Unknown error',
    userMessage,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ApiError) {
    return {
      ...report,
      statusCode: error.statusCode,
      validationErrors: error.errors,
    };
  }

  return report;
}

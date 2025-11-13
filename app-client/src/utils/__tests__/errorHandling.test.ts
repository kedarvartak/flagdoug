/**
 * Error Handling Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  classifyError,
  isNetworkError,
  isRetryableError,
  getUserFriendlyMessage,
  mapValidationErrors,
  retryWithBackoff,
  logError,
  createErrorReport,
  ErrorType,
} from '../errorHandling';
import { ApiError } from '../../types/api.types';

describe('errorHandling', () => {
  describe('classifyError', () => {
    it('should classify network errors', () => {
      const error = new ApiError(0, 'Network error');
      expect(classifyError(error)).toBe(ErrorType.NETWORK);
    });

    it('should classify timeout errors', () => {
      const error = new ApiError(408, 'Timeout');
      expect(classifyError(error)).toBe(ErrorType.TIMEOUT);
    });

    it('should classify validation errors', () => {
      const error400 = new ApiError(400, 'Bad request');
      const error422 = new ApiError(422, 'Validation failed');
      expect(classifyError(error400)).toBe(ErrorType.VALIDATION);
      expect(classifyError(error422)).toBe(ErrorType.VALIDATION);
    });

    it('should classify unauthorized errors', () => {
      const error = new ApiError(401, 'Unauthorized');
      expect(classifyError(error)).toBe(ErrorType.UNAUTHORIZED);
    });

    it('should classify forbidden errors', () => {
      const error = new ApiError(403, 'Forbidden');
      expect(classifyError(error)).toBe(ErrorType.FORBIDDEN);
    });

    it('should classify not found errors', () => {
      const error = new ApiError(404, 'Not found');
      expect(classifyError(error)).toBe(ErrorType.NOT_FOUND);
    });

    it('should classify server errors', () => {
      const error500 = new ApiError(500, 'Server error');
      const error503 = new ApiError(503, 'Service unavailable');
      expect(classifyError(error500)).toBe(ErrorType.SERVER);
      expect(classifyError(error503)).toBe(ErrorType.SERVER);
    });

    it('should classify TypeError as network error', () => {
      const error = new TypeError('Failed to fetch');
      expect(classifyError(error)).toBe(ErrorType.NETWORK);
    });

    it('should classify AbortError as timeout', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      expect(classifyError(error)).toBe(ErrorType.TIMEOUT);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Unknown');
      expect(classifyError(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const error = new ApiError(0, 'Network error');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const error = new ApiError(404, 'Not found');
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for timeout errors', () => {
      const error = new ApiError(408, 'Timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      const error = new ApiError(429, 'Too many requests');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors', () => {
      const error500 = new ApiError(500, 'Server error');
      const error502 = new ApiError(502, 'Bad gateway');
      const error503 = new ApiError(503, 'Service unavailable');
      const error504 = new ApiError(504, 'Gateway timeout');

      expect(isRetryableError(error500)).toBe(true);
      expect(isRetryableError(error502)).toBe(true);
      expect(isRetryableError(error503)).toBe(true);
      expect(isRetryableError(error504)).toBe(true);
    });

    it('should return true for network errors', () => {
      const error = new ApiError(0, 'Network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const error = new ApiError(400, 'Bad request');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for not found errors', () => {
      const error = new ApiError(404, 'Not found');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for network errors', () => {
      const error = new ApiError(0, 'Network error');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('connect to the server');
    });

    it('should return friendly message for timeout errors', () => {
      const error = new ApiError(408, 'Timeout');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('took too long');
    });

    it('should return friendly message for validation errors', () => {
      const error = new ApiError(400, 'Invalid input');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Invalid input');
    });

    it('should return friendly message for not found errors', () => {
      const error = new ApiError(404, 'Not found');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('not found');
    });

    it('should return friendly message for unauthorized errors', () => {
      const error = new ApiError(401, 'Unauthorized');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('not authorized');
    });

    it('should return friendly message for forbidden errors', () => {
      const error = new ApiError(403, 'Forbidden');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('do not have permission');
    });

    it('should return friendly message for server errors', () => {
      const error = new ApiError(500, 'Server error');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('server error');
    });

    it('should return error message for unknown errors', () => {
      const error = new Error('Custom error');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Custom error');
    });
  });

  describe('mapValidationErrors', () => {
    it('should map validation errors to field errors', () => {
      const error = new ApiError(400, 'Validation failed', [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ]);

      const fieldErrors = mapValidationErrors(error);
      expect(fieldErrors).toEqual({
        email: 'Invalid email',
        password: 'Password too short',
      });
    });

    it('should return null for errors without validation errors', () => {
      const error = new ApiError(404, 'Not found');
      const fieldErrors = mapValidationErrors(error);
      expect(fieldErrors).toBeNull();
    });

    it('should return null for non-ApiError errors', () => {
      const error = new Error('Generic error');
      const fieldErrors = mapValidationErrors(error);
      expect(fieldErrors).toBeNull();
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new ApiError(503, 'Service unavailable'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 1 });

      // Fast-forward through the retry delay
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError(404, 'Not found'));

      await expect(retryWithBackoff(fn)).rejects.toThrow('Not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const error = new ApiError(503, 'Service unavailable');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, { maxRetries: 2 });

      // Fast-forward through all retry delays
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Service unavailable');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new ApiError(503, 'Service unavailable'))
        .mockRejectedValueOnce(new ApiError(503, 'Service unavailable'))
        .mockResolvedValue('success');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 1000,
        backoffMultiplier: 2,
      });

      // Fast-forward through all timers
      await vi.runAllTimersAsync();

      await promise;

      // Check that delays increased exponentially
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retrying in 1000ms'),
        expect.anything(),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retrying in 2000ms'),
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('logError', () => {
    it('should log ApiError with details', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new ApiError(400, 'Bad request', [
        { field: 'email', message: 'Invalid' },
      ]);

      logError(error, 'Test context');

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          type: ErrorType.VALIDATION,
          statusCode: 400,
          context: 'Test context',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('should log regular Error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          type: ErrorType.UNKNOWN,
          message: expect.stringContaining('Test error'),
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createErrorReport', () => {
    it('should create detailed report for ApiError', () => {
      const error = new ApiError(400, 'Bad request', [
        { field: 'email', message: 'Invalid' },
      ]);

      const report = createErrorReport(error);

      expect(report).toMatchObject({
        type: ErrorType.VALIDATION,
        message: 'Bad request',
        statusCode: 400,
        validationErrors: [{ field: 'email', message: 'Invalid' }],
      });
      expect(report.timestamp).toBeDefined();
      expect(report.userMessage).toBeDefined();
    });

    it('should create report for regular Error', () => {
      const error = new Error('Test error');
      const report = createErrorReport(error);

      expect(report).toMatchObject({
        type: ErrorType.UNKNOWN,
        message: 'Test error',
      });
      expect(report.timestamp).toBeDefined();
      expect(report.userMessage).toBeDefined();
    });
  });
});

/**
 * useErrorHandler Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { ApiError } from '../../types/api.types';
import { ErrorType } from '../../utils/errorHandling';

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorType).toBeNull();
    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('should handle ApiError', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new ApiError(400, 'Bad request');

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.errorMessage).toBeDefined();
    expect(result.current.errorType).toBe(ErrorType.VALIDATION);
    expect(result.current.hasError).toBe(true);
  });

  it('should handle validation errors with field mapping', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new ApiError(400, 'Validation failed', [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Password too short' },
    ]);

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.fieldErrors).toEqual({
      email: 'Invalid email',
      password: 'Password too short',
    });
    expect(result.current.isValidationError).toBe(true);
    expect(result.current.getFieldError('email')).toBe('Invalid email');
    expect(result.current.getFieldError('password')).toBe('Password too short');
  });

  it('should handle network errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new ApiError(0, 'Network error');

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.errorType).toBe(ErrorType.NETWORK);
    expect(result.current.isNetworkError).toBe(true);
    expect(result.current.errorMessage).toContain('connect to the server');
  });

  it('should handle generic errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Something went wrong');

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.hasError).toBe(true);
  });

  it('should handle non-Error objects', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('String error');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.hasError).toBe(true);
  });

  it('should clear error state', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new ApiError(400, 'Bad request');

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.errorType).toBeNull();
    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('should log error with context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useErrorHandler());
    const error = new ApiError(404, 'Not found');

    act(() => {
      result.current.handleError(error, 'Fetching user data');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error handled:',
      expect.objectContaining({
        type: ErrorType.NOT_FOUND,
      }),
      { context: 'Fetching user data' },
    );

    consoleSpy.mockRestore();
  });

  it('should return undefined for non-existent field errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new ApiError(400, 'Validation failed', [
      { field: 'email', message: 'Invalid email' },
    ]);

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.getFieldError('nonexistent')).toBeUndefined();
  });

  it('should handle multiple errors sequentially', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(new ApiError(404, 'Not found'));
    });

    expect(result.current.errorType).toBe(ErrorType.NOT_FOUND);

    act(() => {
      result.current.handleError(new ApiError(500, 'Server error'));
    });

    expect(result.current.errorType).toBe(ErrorType.SERVER);
  });
});
